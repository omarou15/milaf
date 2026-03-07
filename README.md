# Mi-Laf — ملف

> Le moteur universel de génération et d'automatisation documentaire

## Vision

Mi-Laf permet à n'importe quelle entreprise de cloner, automatiser et maintenir ses documents — indépendamment du domaine, du pays ou de la réglementation.

## Architecture

- **Tier 1** — Word avec balises `{{champs}}` (carbone.io)
- **Tier 2** — PDF AcroForm avec champs formulaire (pdf-lib)
- **Tier 3** — PDF pixel-perfect (Vision IA + WeasyPrint) — Phase 2

## Stack

- **Frontend** : Next.js 14 + TypeScript + TailwindCSS
- **API** : Hono (Edge Functions)
- **Auth** : Clerk
- **DB** : PostgreSQL (Neon) + Drizzle ORM
- **Cache** : Redis (Upstash)
- **IA** : Claude API (BYOK)
- **Deploy** : Vercel

## Démarrage

```bash
cp .env.example .env
# Remplir les variables dans .env
pnpm install
pnpm dev
```

## Structure

```
apps/web/          → Next.js Frontend + API Routes
packages/shared/   → Types et constantes partagés
```

## Modules officiels MVP

- 🇫🇷 CEE France (Devis, Facture, AH, FOS)
- 🇫🇷 MaPrimeRénov
- 🇫🇷🇲🇦 État des lieux

---

**Mi-Laf — Le dossier, automatisé. ملف**
