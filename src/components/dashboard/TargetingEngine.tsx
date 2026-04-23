import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, MapPin, Users, Briefcase, DollarSign, Smartphone, TrendingUp, Target } from 'lucide-react';
import { targetingOptions, BEHAVIORS, REGIONS, COUNTRIES, CITIES } from '../../data/targetingOptions';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { calculateTimeEstimate } from '../../utils/timeEstimation';

export interface TargetingConfig {
  geography: {
    countries: string[];
    cities: string[];
    cityEnabled: boolean;
  };
  demographics: {
    ageRanges: string[];
    genders: string[];
    education: string[];
    marital: string[];
    parental: string[];
    employment: string[];
  };
  professional: {
    industries: string[];
    roles: string[];
    companySizes: string[];
  };
  financials: {
    incomeRanges: string[];
  };
  behaviors: string[];
  technographics: {
    devices: string[];
  };
  retargeting?: {
    pixelPlatform: string;
    pixelId: string;
  };
}

interface TargetingEngineProps {
  config: TargetingConfig;
  onChange: (config: TargetingConfig) => void;
  respondentCount: number;
}

export default function TargetingEngine({ config, onChange, respondentCount }: TargetingEngineProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: true,
    demographics: false,
    professional: false,
    advanced: false,
  });

  const [isCountriesExpanded, setIsCountriesExpanded] = useState(false);

  const VISIBLE_COUNTRY_LIMIT = 8;

  const timeEstimate = useMemo(() => {
    return calculateTimeEstimate(respondentCount, config);
  }, [config, respondentCount]);

  const availableCities = useMemo(() => {
    const cities: Array<{ value: string; label: string; country: string }> = [];

    config.geography.countries.forEach(countryCode => {
      const countryCities = CITIES[countryCode] || [];
      countryCities.forEach(city => {
        cities.push({
          value: city,
          label: city,
          country: countryCode,
        });
      });
    });

    // Sort cities alphabetically
    return cities
      .filter(city => !config.geography.cities.includes(city.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [config.geography.countries, config.geography.cities]);

  // Check if any selected country has cities available
  const hasCitiesAvailable = useMemo(() => {
    return config.geography.countries.some(countryCode => {
      const countryCities = CITIES[countryCode];
      return countryCities && countryCities.length > 0;
    });
  }, [config.geography.countries]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const countActiveFilters = () => {
    let count = 0;
    count += config.geography.countries.length;
    if (config.geography.cities && config.geography.cities.length > 0) count += config.geography.cities.length;
    count += config.demographics.ageRanges.length;
    count += config.demographics.genders.length;
    count += (config.demographics.education?.length || 0);
    count += (config.demographics.marital?.length || 0);
    count += (config.demographics.parental?.length || 0);
    count += (config.demographics.employment?.length || 0);
    count += config.professional.industries.length;
    count += config.professional.roles.length;
    count += config.professional.companySizes.length;
    count += config.financials.incomeRanges.length;
    count += config.behaviors.length;
    if (config.technographics.devices.length > 0 && !config.technographics.devices.includes('No Preference')) count++;
    return count;
  };

  /** Returns true when every country in a preset is already selected. */
  const isRegionActive = (regionId: string): boolean => {
    const region = REGIONS.find(r => r.id === regionId);
    if (!region || region.countries.length === 0) return false;
    return region.countries.every(c => config.geography.countries.includes(c));
  };

  const selectRegion = (regionId: string) => {
    const region = REGIONS.find(r => r.id === regionId);
    if (!region) return;

    if (isRegionActive(regionId)) {
      // Second click — toggle OFF: remove all countries belonging to this preset
      const newCountries = config.geography.countries.filter(
        c => !region.countries.includes(c)
      );
      onChange({ ...config, geography: { ...config.geography, countries: newCountries } });
    } else {
      // First click — add all preset countries (union, no duplicates)
      const newCountries = [...new Set([...config.geography.countries, ...region.countries])];
      onChange({ ...config, geography: { ...config.geography, countries: newCountries } });
    }
  };

  const addCountry = (countryCode: string) => {
    if (!config.geography.countries.includes(countryCode)) {
      onChange({
        ...config,
        geography: {
          ...config.geography,
          countries: [...config.geography.countries, countryCode],
        },
      });
    }
  };

  const removeCountry = (countryCode: string) => {
    onChange({
      ...config,
      geography: {
        ...config.geography,
        countries: config.geography.countries.filter(c => c !== countryCode),
      },
    });
  };

  const addCity = (city: string) => {
    if (city && !config.geography.cities.includes(city)) {
      onChange({
        ...config,
        geography: {
          ...config.geography,
          cities: [...config.geography.cities, city],
        },
      });
    }
  };

  const removeCity = (city: string) => {
    onChange({
      ...config,
      geography: {
        ...config.geography,
        cities: config.geography.cities.filter(c => c !== city),
      },
    });
  };

  return (
    <div className="space-y-5 px-5 sm:px-6 md:px-0">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Mission Scope</h3>
              <p className="text-xs sm:text-sm text-white/60">
                {countActiveFilters()} targeting filters active
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Est. Time</p>
            <p className={`text-xl font-bold ${timeEstimate.color}`}>
              {timeEstimate.display}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-2">Fair Pricing Logic</h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              We charge <span className="font-semibold text-amber-400">$0.50 per filter</span> to cover data costs. However, we apply a <span className="font-semibold text-[#CCFF00]">Smart Cap</span> (Max $1.00 - $1.50 per category) so you never overpay when selecting multiple options in the same group.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('location')}
            className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition"
          >
            <div className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span>Location</span>
            </div>
            {expandedSections.location ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" />}
          </button>

          {expandedSections.location && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Quick Select Regions</label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(region => {
                    const active = isRegionActive(region.id);
                    return (
                      <button
                        key={region.id}
                        onClick={() => selectRegion(region.id)}
                        title={active ? `Remove ${region.label} countries` : `Add ${region.label} countries`}
                        className={`px-4 py-2 border rounded-lg text-xs sm:text-sm font-medium transition ${
                          active
                            ? 'bg-primary/40 border-primary text-primary ring-1 ring-primary/50'
                            : 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30'
                        }`}
                      >
                        {region.label}
                        {active && <span className="ml-1.5 text-[10px] opacity-70">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Selected Countries (Multi-Select)</label>

                {config.geography.countries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(isCountriesExpanded
                      ? config.geography.countries
                      : config.geography.countries.slice(0, VISIBLE_COUNTRY_LIMIT)
                    ).map(countryCode => {
                      const country = COUNTRIES.find(c => c.value === countryCode);
                      return (
                        <button
                          key={countryCode}
                          onClick={() => removeCountry(countryCode)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary/30 text-primary rounded-full text-xs font-bold hover:bg-primary/30 transition-colors"
                        >
                          {country?.label || countryCode}
                          <span className="text-xs">×</span>
                        </button>
                      );
                    })}

                    {!isCountriesExpanded && config.geography.countries.length > VISIBLE_COUNTRY_LIMIT && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsCountriesExpanded(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-white/20 text-white/70 rounded-full text-xs font-bold hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        +{config.geography.countries.length - VISIBLE_COUNTRY_LIMIT} MORE
                      </button>
                    )}

                    {isCountriesExpanded && config.geography.countries.length > VISIBLE_COUNTRY_LIMIT && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsCountriesExpanded(false);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-white/20 text-white/70 rounded-full text-xs font-bold hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Show Less
                      </button>
                    )}
                  </div>
                )}

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addCountry(e.target.value);
                    }
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 sm:py-3.5 text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">+ Add Country</option>
                  {COUNTRIES
                    .filter(country => !config.geography.countries.includes(country.value))
                    .map(country => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                </select>

                {config.geography.countries.length > 0 && (
                  <p className="text-xs text-white/40 mt-2">
                    {config.geography.countries.length} {config.geography.countries.length === 1 ? 'country' : 'countries'} selected
                  </p>
                )}
              </div>

              {/* Only show City Targeting toggle if cities are available for selected countries */}
              {config.geography.countries.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs sm:text-sm text-white/60">
                      City Targeting <span className="text-amber-400 font-semibold">(+$1.00 per respondent)</span>
                    </label>
                    <div className="relative group">
                      <button
                        disabled={!hasCitiesAvailable}
                        onClick={() => {
                          if (hasCitiesAvailable) {
                            onChange({
                              ...config,
                              geography: {
                                ...config.geography,
                                cityEnabled: !config.geography.cityEnabled,
                                cities: !config.geography.cityEnabled ? config.geography.cities : [],
                              },
                            });
                          }
                        }}
                        title={!hasCitiesAvailable ? "City targeting unavailable for this region" : ""}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                          !hasCitiesAvailable
                            ? 'bg-white/10 opacity-50 cursor-not-allowed'
                            : config.geography.cityEnabled
                            ? 'bg-primary cursor-pointer'
                            : 'bg-white/20 cursor-pointer hover:bg-white/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.geography.cityEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      {!hasCitiesAvailable && (
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-white/10">
                            City targeting unavailable for this region
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                {config.geography.cityEnabled && (
                  <>
                    {config.geography.cities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {config.geography.cities.map(city => (
                          <button
                            key={city}
                            onClick={() => removeCity(city)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-400/50 text-amber-400 rounded-full text-xs font-bold hover:bg-amber-500/30 transition-colors"
                          >
                            {city}
                            <span className="text-xs">×</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {config.geography.countries.length === 0 ? (
                      <p className="text-xs text-white/40 italic">
                        Please select at least one country to see available cities
                      </p>
                    ) : availableCities.length === 0 ? (
                      <p className="text-xs text-white/40 italic">
                        All cities selected or no cities available for selected countries
                      </p>
                    ) : (
                      <>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addCity(e.target.value);
                            }
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 sm:py-3.5 text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">+ Add City</option>
                          {config.geography.countries.map(countryCode => {
                            const countryCities = availableCities.filter(c => c.country === countryCode);
                            if (countryCities.length === 0) return null;

                            const countryName = COUNTRIES.find(c => c.value === countryCode)?.label || countryCode;

                            return (
                              <optgroup key={countryCode} label={countryName}>
                                {countryCities.map(city => (
                                  <option key={city.value} value={city.value}>
                                    {city.label}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>

                        {config.geography.cities.length > 0 && (
                          <p className="text-xs text-white/40 mt-2">
                            {config.geography.cities.length} {config.geography.cities.length === 1 ? 'city' : 'cities'} selected
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('demographics')}
            className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition"
          >
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>Demographics</span>
                <span className="bg-[#CCFF00]/20 text-[#CCFF00] px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-[#CCFF00]/30">FREE</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Age, Gender, Education, Marital, and Parental Status included in base price</p>
            </div>
            {expandedSections.demographics ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" />}
          </button>

          {expandedSections.demographics && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Age Range</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.ageRanges.map(age => (
                    <button
                      key={age}
                      onClick={() => onChange({
                        ...config,
                        demographics: {
                          ...config.demographics,
                          ageRanges: toggleArrayItem(config.demographics.ageRanges, age),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.demographics.ageRanges.includes(age)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Gender</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.genders.map(gender => (
                    <button
                      key={gender}
                      onClick={() => onChange({
                        ...config,
                        demographics: {
                          ...config.demographics,
                          genders: toggleArrayItem(config.demographics.genders, gender),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.demographics.genders.includes(gender)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Education Level</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.education.map(edu => (
                    <button
                      key={edu}
                      onClick={() => onChange({
                        ...config,
                        demographics: {
                          ...config.demographics,
                          education: toggleArrayItem(config.demographics.education || [], edu),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.demographics.education?.includes(edu)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {edu}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Marital Status</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.marital.map(status => (
                    <button
                      key={status}
                      onClick={() => onChange({
                        ...config,
                        demographics: {
                          ...config.demographics,
                          marital: toggleArrayItem(config.demographics.marital || [], status),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.demographics.marital?.includes(status)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Parental Status</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.parental.map(status => (
                    <button
                      key={status}
                      onClick={() => onChange({
                        ...config,
                        demographics: {
                          ...config.demographics,
                          parental: toggleArrayItem(config.demographics.parental || [], status),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.demographics.parental?.includes(status)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Employment Status</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.employment.map(status => (
                    <button
                      key={status}
                      onClick={() => onChange({
                        ...config,
                        demographics: {
                          ...config.demographics,
                          employment: toggleArrayItem(config.demographics.employment || [], status),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.demographics.employment?.includes(status)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('professional')}
            className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition"
          >
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>Professional (B2B)</span>
                <span className="bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-amber-400/30">PAID</span>
                <span className="text-amber-400 text-xs font-mono font-semibold">+$0.50</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Target by Industry, Role, or Company Size. Price capped at $1.50 max</p>
            </div>
            {expandedSections.professional ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" />}
          </button>

          {expandedSections.professional && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Industry</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.industries.map(industry => (
                    <button
                      key={industry}
                      onClick={() => onChange({
                        ...config,
                        professional: {
                          ...config.professional,
                          industries: toggleArrayItem(config.professional.industries, industry),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.professional.industries.includes(industry)
                          ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Role/Seniority</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.roles.map(role => (
                    <button
                      key={role}
                      onClick={() => onChange({
                        ...config,
                        professional: {
                          ...config.professional,
                          roles: toggleArrayItem(config.professional.roles, role),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.professional.roles.includes(role)
                          ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Company Size</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.companySizes.map(size => (
                    <button
                      key={size}
                      onClick={() => onChange({
                        ...config,
                        professional: {
                          ...config.professional,
                          companySizes: toggleArrayItem(config.professional.companySizes, size),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.professional.companySizes.includes(size)
                          ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition"
          >
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>Advanced Filters</span>
                <span className="bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-amber-400/30">PAID</span>
                <span className="text-amber-400 text-xs font-mono font-semibold">+$0.50</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Income, Behaviors, and Technographics. Price capped at $1.00 max per category</p>
            </div>
            {expandedSections.advanced ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" />}
          </button>

          {expandedSections.advanced && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">Household Income</label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.incomeRanges.map(income => (
                    <button
                      key={income}
                      onClick={() => onChange({
                        ...config,
                        financials: {
                          incomeRanges: toggleArrayItem(config.financials.incomeRanges, income),
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.financials.incomeRanges.includes(income)
                          ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {income}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-4">Behavioral Targeting</label>
                <div className="space-y-4">
                  {BEHAVIORS.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">{category.category}</h4>
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {category.options.map((behavior) => (
                          <button
                            key={behavior.id}
                            onClick={() => onChange({
                              ...config,
                              behaviors: toggleArrayItem(config.behaviors, behavior.id),
                            })}
                            className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                              config.behaviors.includes(behavior.id)
                                ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            {behavior.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3 flex items-center gap-2">
                  <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                  Device Type
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {targetingOptions.devices.map(device => (
                    <button
                      key={device}
                      onClick={() => onChange({
                        ...config,
                        technographics: {
                          devices: [device],
                        },
                      })}
                      className={`px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                        config.technographics.devices.includes(device)
                          ? 'bg-primary text-gray-900'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {device}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <CollapsibleSection
          title={
            <div className="flex items-center gap-2 flex-wrap">
              <span>Advanced: Retargeting & Integrations</span>
              <span className="text-amber-400 font-bold text-sm">+ $1.50 / respondent</span>
            </div>
          }
          subtitle="Optional: Add your tracking pixel to build retargeting audiences from this mission"
          icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
          defaultExpanded={false}
        >
          <div className="space-y-4 pt-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
              <p className="text-xs text-white/60 leading-relaxed">
                Connect a tracking pixel to automatically build custom audiences on your ad platform.
                This allows you to retarget respondents who completed your mission with follow-up campaigns.
              </p>
              <div className="pt-2 border-t border-blue-500/10">
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  <span className="font-semibold">Note:</span> Activating audience retargeting adds a $1.50 fee per respondent to cover data processing and signal passing.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-white/60 mb-3">Pixel Platform</label>
              <select
                value={config.retargeting?.pixelPlatform || ''}
                onChange={(e) => onChange({
                  ...config,
                  retargeting: {
                    pixelPlatform: e.target.value,
                    pixelId: config.retargeting?.pixelId || '',
                  },
                })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 sm:py-3.5 text-white text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Select a platform (optional)</option>
                <option value="facebook">Facebook Pixel</option>
                <option value="google">Google Ads Conversion</option>
                <option value="tiktok">TikTok Pixel</option>
                <option value="linkedin">LinkedIn Insight Tag</option>
                <option value="twitter">Twitter Pixel</option>
                <option value="snapchat">Snapchat Pixel</option>
              </select>
            </div>

            {config.retargeting?.pixelPlatform && (
              <div>
                <label className="block text-xs sm:text-sm text-white/60 mb-3">
                  Pixel ID
                  <span className="text-white/40 ml-2">(found in your ads manager)</span>
                  {config.retargeting?.pixelId && config.retargeting.pixelId.trim().length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded-full border border-green-500/30">
                      Active
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={config.retargeting?.pixelId || ''}
                  onChange={(e) => onChange({
                    ...config,
                    retargeting: {
                      pixelPlatform: config.retargeting?.pixelPlatform || '',
                      pixelId: e.target.value,
                    },
                  })}
                  placeholder="Enter your pixel ID"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 sm:py-3.5 text-white text-sm focus:ring-2 focus:ring-primary outline-none placeholder:text-white/30"
                />
                <p className="text-xs text-white/40 mt-2">
                  This pixel will fire when respondents complete your mission, allowing you to retarget them.
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
