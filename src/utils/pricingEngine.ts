import { Question } from '../components/dashboard/QuestionEngine';
import { TargetingConfig } from '../components/dashboard/TargetingEngine';
import { COUNTRIES, BEHAVIORS } from '../data/targetingOptions';

export interface PricingBreakdown {
  base: number;
  questionSurcharge: number;
  targetingSurcharge: number;
  screeningSurcharge: number;
  retargetingSurcharge: number;
  total: number;
  filterCount: number;
}

const PIXEL_TRACKING_FEE = 1.50;

const getTierPrice = (tier: number): number => {
  switch (tier) {
    case 1:
      return 3.50;
    case 2:
      return 2.75;
    case 3:
      return 1.90;
    default:
      return 1.90;
  }
};

export const calculatePricing = (
  respondentCount: number,
  questions: Question[],
  targeting: TargetingConfig,
  isScreeningActive: boolean = false
): PricingBreakdown => {
  let highestTier = 3;

  if (targeting.geography.countries && targeting.geography.countries.length > 0) {
    targeting.geography.countries.forEach(countryCode => {
      const country = COUNTRIES.find(c => c.value === countryCode);
      if (country && country.tier < highestTier) {
        highestTier = country.tier;
      }
    });
  }

  const basePerRespondent = getTierPrice(highestTier);
  const base = respondentCount * basePerRespondent;

  const additionalQuestions = Math.max(0, questions.length - 5);
  const questionSurcharge = additionalQuestions * 20;

  // FREE DEMOGRAPHICS (covered by base price, no additional cost)
  const freeDemographicsCount =
    (targeting.demographics?.ageRanges?.length || 0) +
    (targeting.demographics?.genders?.length || 0) +
    (targeting.demographics?.education?.length || 0) +
    (targeting.demographics?.marital?.length || 0) +
    (targeting.demographics?.parental?.length || 0) +
    (targeting.demographics?.employment?.length || 0);

  // PAID TARGETING CRITERIA

  // Professional B2B: Industries + Roles + Company Sizes (capped at $1.50)
  const professionalB2BCount =
    (targeting.professional?.industries?.length || 0) +
    (targeting.professional?.roles?.length || 0) +
    (targeting.professional?.companySizes?.length || 0);
  const professionalB2BCost = Math.min(professionalB2BCount * 0.50, 1.50);

  // Technographics: Devices + Behaviors (capped at $1.00)
  const devicesCount = targeting.technographics?.devices
    ? targeting.technographics.devices.filter(d => d !== 'No Preference').length
    : 0;
  const behaviorsCount = targeting.behaviors?.length || 0;
  const technographicsCount = devicesCount + behaviorsCount;
  const technographicsCost = Math.min(technographicsCount * 0.50, 1.00);

  // Financial: Household Income + Investments (capped at $1.00)
  const incomeCount = targeting.financials?.incomeRanges?.length || 0;
  const financialCost = Math.min(incomeCount * 0.50, 1.00);

  // Calculate per-respondent filter cost (demographics excluded)
  const perRespondentFilterCost =
    professionalB2BCost +
    technographicsCost +
    financialCost;

  let targetingSurcharge = perRespondentFilterCost * respondentCount;

  // City targeting is a separate flat fee
  if (targeting.geography.cities && targeting.geography.cities.length > 0) {
    targetingSurcharge += 1.00 * respondentCount;
  }

  const totalPaidFilterCount = professionalB2BCount + technographicsCount + incomeCount;

  const screeningSurcharge = isScreeningActive ? respondentCount * 0.50 : 0;

  // Retargeting pixel fee
  const hasPixel = targeting.retargeting?.pixelId && targeting.retargeting.pixelId.trim().length > 0;
  const retargetingSurcharge = hasPixel ? respondentCount * PIXEL_TRACKING_FEE : 0;

  const total = base + questionSurcharge + targetingSurcharge + screeningSurcharge + retargetingSurcharge;

  // Detailed pricing breakdown for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log("=== PRICING BREAKDOWN ===");
    console.log(`Base: $${base} (${respondentCount} × $${basePerRespondent})`);

    if (freeDemographicsCount > 0) {
      console.log(`\n✓ FREE Demographics (covered by base): ${freeDemographicsCount} items → $0.00`);
    }

    console.log(`\nPAID Targeting Filters (per-category caps):`);
    if (professionalB2BCount > 0) {
      console.log(`  • Professional B2B: ${professionalB2BCount} items × $0.50 = $${(professionalB2BCount * 0.50).toFixed(2)} → capped at $${professionalB2BCost.toFixed(2)}`);
    }
    if (technographicsCount > 0) {
      console.log(`  • Technographics: ${technographicsCount} items × $0.50 = $${(technographicsCount * 0.50).toFixed(2)} → capped at $${technographicsCost.toFixed(2)}`);
    }
    if (incomeCount > 0) {
      console.log(`  • Financial: ${incomeCount} items × $0.50 = $${(incomeCount * 0.50).toFixed(2)} → capped at $${financialCost.toFixed(2)}`);
    }

    if (perRespondentFilterCost > 0) {
      console.log(`\nPaid Filter Cost: $${perRespondentFilterCost.toFixed(2)} per respondent × ${respondentCount} = $${targetingSurcharge.toFixed(2)}`);
    }

    if (targeting.geography.cities?.length > 0) console.log(`+ City Targeting: $${(1.00 * respondentCount).toFixed(2)}`);
    if (questionSurcharge > 0) console.log(`+ Extra Questions: $${questionSurcharge.toFixed(2)}`);
    if (screeningSurcharge > 0) console.log(`+ Screening: $${screeningSurcharge.toFixed(2)}`);
    if (retargetingSurcharge > 0) console.log(`+ Audience Activation (Pixel): $${retargetingSurcharge.toFixed(2)} (${respondentCount} × $${PIXEL_TRACKING_FEE.toFixed(2)})`);
    console.log(`\nTOTAL: $${total.toFixed(2)}`);
    console.log("========================");
  }

  const cityFilterCount = targeting.geography.cities && targeting.geography.cities.length > 0 ? 1 : 0;
  const filterCount = totalPaidFilterCount + cityFilterCount;

  return {
    base: Math.round(base),
    questionSurcharge,
    targetingSurcharge: Math.round(targetingSurcharge),
    screeningSurcharge: Math.round(screeningSurcharge),
    retargetingSurcharge: Math.round(retargetingSurcharge),
    total: Math.round(total),
    filterCount,
  };
};
