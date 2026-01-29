import { TargetingConfig } from '../components/dashboard/TargetingEngine';
import { COUNTRIES } from '../data/targetingOptions';

// Linear Velocity Model - Market Tiers (responses per hour)
const MARKET_VELOCITY = {
  tier1: 150, // US, UK, CA, AU, etc.
  tier2: 80,  // UAE, KSA, DE, FR, etc.
  tier3: 40,  // Rest of world
};

const getMarketVelocity = (countries: string[]): number => {
  if (countries.length === 0) return MARKET_VELOCITY.tier2;

  const velocities = countries.map(code => {
    const country = COUNTRIES.find(c => c.value === code);
    if (!country) return MARKET_VELOCITY.tier3;

    if (country.tier === 1) return MARKET_VELOCITY.tier1;
    if (country.tier === 2) return MARKET_VELOCITY.tier2;
    return MARKET_VELOCITY.tier3;
  });

  return Math.min(...velocities);
};

export interface TimeEstimate {
  display: string;
  color: string;
  badge: string;
  hours: number;
}

export const calculateTimeEstimate = (
  respondentCount: number,
  config: TargetingConfig
): TimeEstimate => {
  let velocity = getMarketVelocity(config.geography.countries);

  if (config.geography.cities && config.geography.cities.length > 0) {
    velocity *= 0.5;
  }

  if (config.financials.incomeRanges.length > 0) {
    velocity *= 0.25;
  }

  const hasAgeFilter = config.demographics.ageRanges.length > 0 && config.demographics.ageRanges.length < 6;
  const hasGenderFilter = config.demographics.genders.length > 0 && config.demographics.genders.length < 3;

  if (hasAgeFilter || hasGenderFilter) {
    velocity *= 0.8;
  }

  const rawHours = (respondentCount / velocity) + 1;

  let minTime = Math.ceil(rawHours);
  let maxTime = Math.ceil(rawHours * 1.5);

  if (minTime === maxTime) {
    maxTime = minTime + 1;
  }

  let display = '';
  let color = '';
  let badge = '';

  if (minTime < 24) {
    display = `${minTime}-${maxTime} Hours`;
    color = 'text-green-400';
    badge = '⚡ Fast Delivery';
  } else {
    const minDays = Math.ceil(minTime / 24);
    let maxDays = Math.ceil(maxTime / 24);

    if (minDays === maxDays) {
      maxDays = minDays + 1;
    }

    display = `${minDays}-${maxDays} Days`;
    color = 'text-yellow-400';
    badge = 'Standard Delivery';
  }

  return { display, color, badge, hours: maxTime };
};
