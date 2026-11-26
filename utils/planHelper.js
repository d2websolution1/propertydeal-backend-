// utils/planHelper.js

export const PLAN_PRESETS = [
  {
    id: "owner-starter",
    name: "Free Starter (30 Days)",
    price: 0,
    priceLabel: "₹0",
    limit: 2,
    days: 30,
    featured: 0,
  },
  {
    id: "owner-gold",
    name: "Gold Owner Plan (60 Days)",
    price: 499,
    priceLabel: "₹499",
    limit: 5,
    days: 60,
    featured: 1,
  },
  {
    id: "owner-annual",
    name: "Annual Owner Plan (365 Days)",
    price: 1499,
    priceLabel: "₹1499",
    limit: 20,
    days: 365,
    featured: 5,
  },
  {
    id: "agent-std",
    name: "Standard Agent Plan (45 Days)",
    price: 999,
    priceLabel: "₹999",
    limit: 20,
    days: 45,
    featured: 2,
  },
  {
    id: "agent-pro",
    name: "Pro Agent Plan (90 Days)",
    price: 1999,
    priceLabel: "₹1999",
    limit: 50,
    days: 90,
    featured: 5,
  },
  {
    id: "agent-annual",
    name: "Annual Agent Plan (365 Days)",
    price: 4999,
    priceLabel: "₹4999",
    limit: 200,
    days: 365,
    featured: 20,
  },
];

/**
 * Accurately resolve plan details (name, price label, price number, validity days, listing limit)
 * from plan name and optional explicit price/days.
 */
export function resolvePlanDetails(planName, explicitPrice, explicitDays) {
  const name = String(planName || '').trim();
  const lower = name.toLowerCase();

  // 1. Free starter plan
  if (!name || lower.includes('free') || lower.includes('starter') || lower.includes('फ्री')) {
    return {
      name: name || 'Free Starter (30 Days)',
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
      : (lower.includes('365') ? 365 : lower.includes('90') ? 90 : lower.includes('60') ? 60 : lower.includes('45') ? 45 : 30);
    return {
      name,
      price: `₹${pNum}`,
      priceNum: pNum,
      days: dNum,
      limit: pNum >= 4999 ? 200 : pNum >= 1999 ? 50 : pNum >= 999 ? 20 : pNum >= 499 ? 5 : 2,
      isFree: false,
    };
  }

  // 3. Standard Agent Plan (45 Days) -> ₹999, 45 Days, 20 Listings
  if (lower.includes('standard agent') || lower.includes('agent plan (45') || lower.includes('45 day') || lower.includes('999')) {
    return {
      name: 'Standard Agent Plan (45 Days)',
      price: '₹999',
      priceNum: 999,
      days: 45,
      limit: 20,
      isFree: false,
    };
  }

  // 4. Gold Owner Plan (60 Days) -> ₹499, 60 Days, 5 Listings
  if (lower.includes('gold') || lower.includes('owner plan (60') || lower.includes('60 day') || lower.includes('499')) {
    return {
      name: 'Gold Owner Plan (60 Days)',
      price: '₹499',
      priceNum: 499,
      days: 60,
      limit: 5,
      isFree: false,
    };
  }

  // 5. Annual Agent Plan (365 Days) -> ₹4999, 365 Days, 200 Listings
  if (lower.includes('annual agent') || lower.includes('4999')) {
    return {
      name: 'Annual Agent Plan (365 Days)',
      price: '₹4999',
      priceNum: 4999,
      days: 365,
      limit: 200,
      isFree: false,
    };
  }

  // 6. Annual Owner Plan (365 Days) -> ₹1499, 365 Days, 20 Listings
  if (lower.includes('annual owner') || (lower.includes('annual') && !lower.includes('agent')) || lower.includes('1499')) {
    return {
      name: 'Annual Owner Plan (365 Days)',
      price: '₹1499',
      priceNum: 1499,
      days: 365,
      limit: 20,
      isFree: false,
    };
  }

  // 7. Pro Agent Plan (90 Days) -> ₹1999, 90 Days, 50 Listings
  if (lower.includes('pro agent') || lower.includes('90 day') || lower.includes('1999')) {
    return {
      name: 'Pro Agent Plan (90 Days)',
      price: '₹1999',
      priceNum: 1999,
      days: 90,
      limit: 50,
      isFree: false,
    };
  }

  // Fallback for custom or unknown plan
  return {
    name,
    price: '₹499',
    priceNum: 499,
    days: 30,
    limit: 5,
    isFree: false,
  };
}
