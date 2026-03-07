export const CREDITS_COST = {
  tier1_word: 1,
  tier2_pdf_form: 2,
  tier3_pixel: 5,
  diff_analysis: 3,
  template_ingestion: 5,
} as const;

export const PLANS = {
  starter:    { price: 15,  credits: 100,  templates: 5 },
  pro:        { price: 39,  credits: 500,  templates: -1 },
  business:   { price: 99,  credits: 2000, templates: -1 },
  enterprise: { price: -1,  credits: -1,   templates: -1 },
} as const;

export const MARKETPLACE_COMMISSION = 0.20;
