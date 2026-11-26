// utils/planHelper.js

export const PLAN_PRESETS = [
  {
    id: "free-starter",
    name: "Free Starter (30 Days)",
    price: 0,
    priceLabel: "₹0",
    limit: 2,
    days: 30,
    featured: 0,
    desc: "2 free listings for 1 month (Active by default)",
  },
  {
    id: "gold-499",
    name: "Gold Plan (90 Days)",
    price: 499,
    priceLabel: "₹499",
    limit: 10,
    days: 90,
    featured: 2,
    desc: "₹499 me 10 listings for 3 months",
  },
  {
    id: "pro-999",
    name: "Pro Plan (270 Days)",
    price: 999,
    priceLabel: "₹999",
    limit: 30,
    days: 270,
    featured: 5,
    desc: "₹999 me 30 listings for 9 months",
  },
];

/**
 * Accurately resolve plan details (name, price label, price number, validity days, listing limit)
 * from plan name and optional explicit price/days.
 */
export function resolvePlanDetails(planName, explicitPrice, explicitDays) {
  const name = String(planName || '').trim();
  const lower = name.toLowerCase();

  // 1. Free starter plan (2 free listings for 1 month - active by default)
  if (!name || lower.includes('free') || lower.includes('starter') || lower.includes('फ्री')) {
    return {
      name: 'Free Starter (30 Days)',
      price: '₹0',
      priceNum: 0,
      days: 30,
      limit: 2,
      isFree: true,
    };
  }

  // 2. Explicit price provided > 0
  if (explicitPrice !== undefined && explicitPrice !== null && Number(explicitPrice) > 0) {
    const pNum = Number(explicitPrice);
    const dNum = Number(explicitDays) > 0
      ? Number(explicitDays)
      : (pNum >= 999 ? 270 : pNum >= 499 ? 90 : 30);
    return {
      name,
      price: `₹${pNum}`,
      priceNum: pNum,
      days: dNum,
      limit: pNum >= 999 ? 30 : pNum >= 499 ? 10 : 2,
      isFree: false,
    };
  }

  // 3. Pro Plan: ₹999 for 30 listings, 9 months (270 days)
  if (lower.includes('999') || lower.includes('pro') || lower.includes('270') || lower.includes('9 month') || lower.includes('standard agent')) {
    return {
      name: 'Pro Plan (270 Days)',
      price: '₹999',
      priceNum: 999,
      days: 270,
      limit: 30,
      isFree: false,
    };
  }

  // 4. Gold Plan: ₹499 for 10 listings, 3 months (90 days)
  if (lower.includes('499') || lower.includes('gold') || lower.includes('90') || lower.includes('3 month') || lower.includes('owner plan (60')) {
    return {
      name: 'Gold Plan (90 Days)',
      price: '₹499',
      priceNum: 499,
      days: 90,
      limit: 10,
      isFree: false,
    };
  }

  // Fallback
  return {
    name: name || 'Gold Plan (90 Days)',
    price: '₹499',
    priceNum: 499,
    days: 90,
    limit: 10,
    isFree: false,
  };
}
