#!/usr/bin/env python3
"""
Mi-Laf PDF Analyzer — PyMuPDF
Extrait coordonnées, couleurs, textes, formes vectorielles d'un PDF.
Usage: python3 pdf_analyzer.py <path_to_pdf>
Output: JSON sur stdout
"""

import sys
import json
import fitz  # PyMuPDF

def rgb_from_int(color_int):
    """Convertit un entier couleur PDF en tuple RGB 0-255."""
    if color_int is None:
        return None
    r = (color_int >> 16) & 0xFF
    g = (color_int >> 8) & 0xFF
    b = color_int & 0xFF
    return [r, g, b]

def rgb_from_float(color_tuple):
    """Convertit un tuple float (0.0-1.0) en RGB 0-255."""
    if color_tuple is None:
        return None
    try:
        return [int(c * 255) for c in color_tuple[:3]]
    except Exception:
        return None

def rgb_to_hex(rgb):
    if not rgb:
        return None
    return "#{:02X}{:02X}{:02X}".format(rgb[0], rgb[1], rgb[2])

def analyze_page(page, page_num):
    """Analyse complète d'une page PDF."""
    result = {
        "page_number": page_num,
        "text_blocks": [],
        "vector_shapes": [],
        "images": [],
        "colors": [],
    }

    color_counter = {}

    # ── Textes ────────────────────────────────────────────────────────────────
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if not text:
                    continue

                x0, y0, x1, y1 = span["bbox"]
                color_int = span.get("color", 0)
                rgb = rgb_from_int(color_int)
                font = span.get("font", "")
                size = round(span.get("size", 0), 1)

                block_data = {
                    "text": text,
                    "x": round(x0, 1),
                    "y": round(y0, 1),
                    "w": round(x1 - x0, 1),
                    "h": round(y1 - y0, 1),
                    "font": font,
                    "size": size,
                    "color_rgb": rgb,
                    "color_hex": rgb_to_hex(rgb),
                    "bold": "Bold" in font or "bold" in font,
                    "italic": "Italic" in font or "italic" in font,
                    "condensed": "Cond" in font or "Condensed" in font,
                }
                result["text_blocks"].append(block_data)

                # Compter les couleurs
                if rgb:
                    key = tuple(rgb)
                    color_counter[key] = color_counter.get(key, {"count": 0, "contexts": set()})
                    color_counter[key]["count"] += 1
                    color_counter[key]["contexts"].add("text")

    # ── Formes vectorielles ────────────────────────────────────────────────────
    drawings = page.get_drawings()
    for i, drawing in enumerate(drawings):
        rect = drawing.get("rect")
        if not rect:
            continue

        x0, y0, x1, y1 = rect
        w, h = x1 - x0, y1 - y0

        # Ignorer les micro-formes
        if w < 2 and h < 2:
            continue

        fill_rgb = rgb_from_float(drawing.get("fill"))
        stroke_rgb = rgb_from_float(drawing.get("color"))
        stroke_width = drawing.get("width") or 0

        shape_data = {
            "index": i,
            "x": round(x0, 1),
            "y": round(y0, 1),
            "w": round(w, 1),
            "h": round(h, 1),
            "fill_rgb": fill_rgb,
            "fill_hex": rgb_to_hex(fill_rgb),
            "stroke_rgb": stroke_rgb,
            "stroke_hex": rgb_to_hex(stroke_rgb),
            "stroke_width": round(stroke_width, 1),
        }
        result["vector_shapes"].append(shape_data)

        # Compter les couleurs
        for rgb, ctx in [(fill_rgb, "fill"), (stroke_rgb, "stroke")]:
            if rgb:
                key = tuple(rgb)
                if key not in color_counter:
                    color_counter[key] = {"count": 0, "contexts": set()}
                color_counter[key]["count"] += 1
                color_counter[key]["contexts"].add(ctx)

    # ── Images embarquées ─────────────────────────────────────────────────────
    doc = page.parent
    for img_info in page.get_images():
        xref = img_info[0]
        try:
            img = doc.extract_image(xref)
            result["images"].append({
                "xref": xref,
                "width": img["width"],
                "height": img["height"],
                "ext": img["ext"],
                "size_bytes": len(img["image"]),
            })
        except Exception:
            pass

    # ── Palette couleurs (triée par fréquence) ────────────────────────────────
    for rgb_tuple, data in sorted(color_counter.items(), key=lambda x: -x[1]["count"]):
        rgb = list(rgb_tuple)
        result["colors"].append({
            "rgb": rgb,
            "hex": rgb_to_hex(rgb),
            "usage_count": data["count"],
            "context": "+".join(data["contexts"]),
        })

    return result

def analyze_pdf(pdf_path):
    """Analyse complète du PDF."""
    doc = fitz.open(pdf_path)

    result = {
        "page_count": len(doc),
        "page_width": round(doc[0].rect.width, 2),
        "page_height": round(doc[0].rect.height, 2),
        "pages": [],
    }

    for i, page in enumerate(doc):
        result["pages"].append(analyze_page(page, i + 1))

    doc.close()
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 pdf_analyzer.py <pdf_path>"}))
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        data = analyze_pdf(pdf_path)
        print(json.dumps(data, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
