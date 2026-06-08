// Fallback option lists mirroring the backend meta() (onboarding.service.js).
// The wizard dropdowns use `meta?.x` when the GET /onboarding/meta call has
// loaded, and fall back to these constants otherwise — so the selects always
// render options even if meta is slow, blocked, or the backend is unreachable.

export const INDUSTRIES = ['IT Services', 'Consulting', 'Manufacturing', 'Finance', 'Healthcare', 'Other']
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']
export const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'America/New_York', 'Europe/London', 'UTC']
export const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Singapore', 'United Arab Emirates']

// Default time zone + currency per country, used to auto-fill those fields once
// the country is known (e.g. resolved from an Indian pincode lookup).
export const COUNTRY_LOCALE = {
  India: { timezone: 'Asia/Kolkata', currency: 'INR' },
  'United States': { timezone: 'America/New_York', currency: 'USD' },
  'United Kingdom': { timezone: 'Europe/London', currency: 'GBP' },
  Singapore: { timezone: 'Asia/Singapore', currency: 'SGD' },
  'United Arab Emirates': { timezone: 'Asia/Dubai', currency: 'AED' },
}

// Pick meta-provided options when present, else fall back to constants.
export function withFallback(metaList, fallback) {
  return Array.isArray(metaList) && metaList.length ? metaList : fallback
}
