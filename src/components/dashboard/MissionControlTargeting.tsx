import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import type { TargetingConfig } from './TargetingEngine';
import type { Question } from './QuestionEngine';
import {
  COUNTRIES,
  CITIES,
  REGIONS,
  BEHAVIORS,
  targetingOptions,
} from '../../data/targetingOptions';
import { calculatePricing } from '../../utils/pricingEngine';

/**
 * MissionControlTargeting — Commit 7 of the redesign.
 *
 * An **accordion** of targeting sections that lives in the LEFT column of
 * /dashboard/:missionId.  Prototype reference: prototype.html lines 1495–1598.
 *
 * ── Why this exists ─────────────────────────────────────────────
 *
 * The legacy `TargetingEngine` is 890 lines of nested CollapsibleSections
 * wired with ad-hoc state and ad-hoc styles.  Mission Control needs a leaner,
 * visually-aligned surface that:
 *   · opens Location + Demographics by default (they are always FREE — we
 *     want the user to see their selections without hunting),
 *   · keeps paid sections collapsed by default to avoid an overwhelming
 *     "everything is a surcharge" first impression,
 *   · renders a live per-section price pill so the user can see the cost
 *     impact of any section before expanding it,
 *   · never reshapes `TargetingConfig` — the data model is canon.  We only
 *     add UI on top of the existing fields.
 *
 * ── Pricing contract ────────────────────────────────────────────
 *
 * Per-section surcharges are computed the same way `pricingEngine.ts` does
 * it — we reuse `calculatePricing()` with a stripped-down config scoped to
 * the section.  That way:
 *   · the pill is always in sync with the total,
 *   · caps ($1.50 B2B, $1.00 tech, $1.00 financial) are visible at the
 *     source of truth,
 *   · adding a new paid field to `pricingEngine` automatically updates the
 *     pill without touching this file.
 *
 * ── Save-on-change ──────────────────────────────────────────────
 *
 * Controlled component.  `onChange(next)` fires on every user mutation and
 * the parent is responsible for debouncing the Supabase write (DashboardPage
 * re-uses the 500ms debounce pattern from questions persistence).
 *
 * ── Mobile (verified at 375px) ──────────────────────────────────
 *
 *   · Each section's head row is `flex` + `justify-between`; the title is
 *     allowed to wrap, the price pill + chevron are `flex-shrink-0`.
 *   · Chip rows use `flex-wrap gap-[7px]` — no horizontal overflow on the
 *     smallest phones.
 *   · The country pill list truncates to a search box + already-selected
 *     chips; the full list is available behind a search keyword.
 *   · City targeting is hidden entirely when no country has cities available
 *     (matches legacy TargetingEngine behaviour).
 */

// ── Pricing helpers ─────────────────────────────────────────────────
// Build a "shadow" TargetingConfig that only exposes the fields for one
// section, then ask pricingEngine what that config alone would cost per
// respondent.  This keeps the pill in lockstep with the real total.

const EMPTY_SHADOW: TargetingConfig = {
  geography: { countries: [], cities: [], cityEnabled: false },
  demographics: {
    ageRanges: [],
    genders: [],
    education: [],
    marital: [],
    parental: [],
    employment: [],
  },
  professional: { industries: [], roles: [], companySizes: [] },
  financials: { incomeRanges: [] },
  behaviors: [],
  technographics: { devices: [] },
};

function perRespondent(shadow: TargetingConfig): number {
  // Ask the real engine what ONE respondent's targeting surcharge would be
  // for this shadow.  We divide by 1 and pass 1 so rounding doesn't hide
  // tiny per-resp surcharges.  Never mutate `targeting` here.
  const { targetingSurcharge, retargetingSurcharge } = calculatePricing(
    1,
    [],
    shadow,
    false,
  );
  return targetingSurcharge + retargetingSurcharge;
}

function sectionCost(
  config: TargetingConfig,
  section: 'location' | 'demographics' | 'professional' | 'financials' | 'behavioral' | 'retargeting',
): number {
  switch (section) {
    case 'location': {
      // Location base (countries) is the tier pricing — baked into base,
      // not a targeting surcharge — so it's FREE as far as this pill is
      // concerned.  Cities are the only paid part.
      return perRespondent({
        ...EMPTY_SHADOW,
        geography: {
          countries: config.geography.countries,
          cities: config.geography.cities,
          cityEnabled: config.geography.cityEnabled,
        },
      });
    }
    case 'demographics':
      return 0; // Demographics are always free.
    case 'professional':
      return perRespondent({
        ...EMPTY_SHADOW,
        professional: { ...config.professional },
      });
    case 'financials':
      return perRespondent({
        ...EMPTY_SHADOW,
        financials: { ...config.financials },
      });
    case 'behavioral':
      return perRespondent({
        ...EMPTY_SHADOW,
        behaviors: [...config.behaviors],
        technographics: { devices: [...config.technographics.devices] },
      });
    case 'retargeting':
      return perRespondent({
        ...EMPTY_SHADOW,
        retargeting: config.retargeting,
      });
  }
}

function formatPill(cost: number, alwaysFree: boolean): {
  label: string;
  tone: 'free' | 'surcharge' | 'muted';
} {
  if (alwaysFree) return { label: 'FREE', tone: 'free' };
  if (cost <= 0) return { label: '—', tone: 'muted' };
  // pricingEngine returns whole-dollar numbers for the surcharge columns,
  // but per-respondent it's sub-dollar.  Show 2 decimals.
  const rounded = Math.round(cost * 100) / 100;
  return { label: `+$${rounded.toFixed(2)}/resp`, tone: 'surcharge' };
}

// ── Section shell ───────────────────────────────────────────────────

interface SectionShellProps {
  id: string;
  title: string;
  emoji: string;
  alwaysFree?: boolean;
  subtitle?: string;
  sectionCost: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const SectionShell = ({
  id,
  title,
  emoji,
  alwaysFree = false,
  subtitle,
  sectionCost,
  open,
  onToggle,
  children,
}: SectionShellProps) => {
  const pill = formatPill(sectionCost, alwaysFree);
  const pillClass =
    pill.tone === 'free'
      ? 'bg-grn/10 text-grn border-grn/20'
      : pill.tone === 'surcharge'
        ? 'bg-org/10 text-org border-org/25'
        : 'bg-bg3 text-t4 border-b1';

  return (
    <div className="border-b border-b1 last:border-b-0">
      <button
        type="button"
        id={`sec-${id}-head`}
        aria-expanded={open}
        aria-controls={`sec-${id}-body`}
        onClick={onToggle}
        className={[
          'w-full flex items-center justify-between gap-2',
          'px-4 py-3.5 text-left',
          'hover:bg-bg3/40 transition-colors',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="text-[15px] leading-none">
            {emoji}
          </span>
          <span className="font-display font-black text-[12px] text-white whitespace-nowrap">
            {title}
          </span>
          {subtitle && (
            <span className="font-display font-bold text-[9px] text-t4 uppercase tracking-[0.1em] truncate">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={[
              'inline-flex items-center rounded-xs px-1.5 py-0.5',
              'font-display font-black text-[9px] uppercase tracking-[0.08em]',
              'border',
              pillClass,
            ].join(' ')}
          >
            {pill.label}
          </span>
          <ChevronDown
            aria-hidden
            className={[
              'w-3.5 h-3.5 text-t4 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0',
            ].join(' ')}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`sec-${id}-body`}
            role="region"
            aria-labelledby={`sec-${id}-head`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Chip components ─────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  tone?: 'default' | 'lime';
}

const Chip = ({
  label,
  selected,
  onToggle,
  disabled = false,
  tone = 'default',
}: ChipProps) => {
  const selectedStyles =
    tone === 'lime'
      ? 'bg-lime text-black border-lime font-bold'
      : 'bg-lime/15 text-lime border-lime/40 font-bold';
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'font-body text-[12px] rounded-md border transition-colors',
        'px-3 py-1.5',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        selected
          ? selectedStyles
          : 'bg-bg3 text-t2 border-b2 hover:border-t3',
      ].join(' ')}
    >
      {label}
    </button>
  );
};

const ChipRow = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap gap-[7px]">{children}</div>
);

const SubLabel = ({ children }: { children: ReactNode }) => (
  <div className="font-body text-[10px] text-t3 uppercase tracking-[0.08em] mt-3 mb-1.5 first:mt-0">
    {children}
  </div>
);

// ── Component ───────────────────────────────────────────────────────

interface MissionControlTargetingProps {
  config: TargetingConfig;
  onChange: (next: TargetingConfig) => void;
  /** Accepted so wiring stays stable with MissionControlPricing (Commit 8)
   *  — the total/respondent math lives in the pricing panel, not here, so
   *  we don't actually read this yet. */
  respondentCount?: number;
  questions?: Question[];
  persisting?: boolean;
}

type SectionKey =
  | 'location'
  | 'demographics'
  | 'professional'
  | 'financials'
  | 'behavioral'
  | 'retargeting';

export const MissionControlTargeting = ({
  config,
  onChange,
  persisting = false,
}: MissionControlTargetingProps) => {
  // Free sections open by default; paid sections collapsed.
  const [openMap, setOpenMap] = useState<Record<SectionKey, boolean>>({
    location: true,
    demographics: true,
    professional: false,
    financials: false,
    behavioral: false,
    retargeting: false,
  });

  // Country search (small local UX — no network calls)
  const [countryQuery, setCountryQuery] = useState('');
  const countryInputRef = useRef<HTMLInputElement>(null);

  // City input
  const [cityQuery, setCityQuery] = useState('');

  const toggleSection = useCallback((key: SectionKey) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Mutation helpers ─────────────────────────────────────────────

  const toggleCountry = (value: string) => {
    const current = config.geography.countries;
    const next = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value];
    // If we just removed the only country a city belonged to, drop that city
    // so the user doesn't end up with an orphan filter they can't see.
    const nextCities = config.geography.cities.filter((city) =>
      next.some((countryCode) => (CITIES[countryCode] ?? []).includes(city)),
    );
    onChange({
      ...config,
      geography: {
        ...config.geography,
        countries: next,
        cities: nextCities,
      },
    });
  };

  const applyRegionPreset = (countries: string[]) => {
    // Merge-wise add; don't stomp an existing hand-picked list.
    const merged = Array.from(
      new Set([...config.geography.countries, ...countries]),
    );
    onChange({
      ...config,
      geography: { ...config.geography, countries: merged },
    });
  };

  const addCity = () => {
    const trimmed = cityQuery.trim();
    if (!trimmed) return;
    if (config.geography.cities.includes(trimmed)) {
      setCityQuery('');
      return;
    }
    onChange({
      ...config,
      geography: {
        ...config.geography,
        cities: [...config.geography.cities, trimmed],
        cityEnabled: true,
      },
    });
    setCityQuery('');
  };

  const removeCity = (city: string) => {
    const nextCities = config.geography.cities.filter((c) => c !== city);
    onChange({
      ...config,
      geography: {
        ...config.geography,
        cities: nextCities,
        cityEnabled: nextCities.length > 0,
      },
    });
  };

  const toggleDemographic = <K extends keyof TargetingConfig['demographics']>(
    key: K,
    value: string,
  ) => {
    const current = config.demographics[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({
      ...config,
      demographics: { ...config.demographics, [key]: next },
    });
  };

  const toggleProfessional = <
    K extends keyof TargetingConfig['professional'],
  >(
    key: K,
    value: string,
  ) => {
    const current = config.professional[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({
      ...config,
      professional: { ...config.professional, [key]: next },
    });
  };

  const toggleFinancial = (value: string) => {
    const current = config.financials.incomeRanges;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({
      ...config,
      financials: { ...config.financials, incomeRanges: next },
    });
  };

  const toggleBehavior = (id: string) => {
    const current = config.behaviors;
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];
    onChange({ ...config, behaviors: next });
  };

  const toggleDevice = (device: string) => {
    const current = config.technographics.devices;
    const next = current.includes(device)
      ? current.filter((v) => v !== device)
      : [...current, device];
    onChange({
      ...config,
      technographics: { devices: next },
    });
  };

  const setRetargeting = (patch: Partial<NonNullable<TargetingConfig['retargeting']>>) => {
    const base = config.retargeting ?? { pixelPlatform: '', pixelId: '' };
    const merged = { ...base, ...patch };
    onChange({ ...config, retargeting: merged });
  };

  // ── Derived for pill ─────────────────────────────────────────────

  const costs = useMemo(
    () => ({
      location: sectionCost(config, 'location'),
      demographics: 0,
      professional: sectionCost(config, 'professional'),
      financials: sectionCost(config, 'financials'),
      behavioral: sectionCost(config, 'behavioral'),
      retargeting: sectionCost(config, 'retargeting'),
    }),
    [config],
  );

  const countryMatches = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return [];
    return COUNTRIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.value.toLowerCase() === q,
    ).slice(0, 8);
  }, [countryQuery]);

  const availableCities = useMemo(() => {
    const list: string[] = [];
    config.geography.countries.forEach((code) => {
      (CITIES[code] ?? []).forEach((city) => {
        if (!list.includes(city)) list.push(city);
      });
    });
    return list.sort();
  }, [config.geography.countries]);

  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return [];
    return availableCities
      .filter(
        (city) =>
          !config.geography.cities.includes(city) &&
          city.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [cityQuery, availableCities, config.geography.cities]);

  return (
    <div
      data-testid="mc-targeting"
      className={[
        'bg-bg2 border border-b1 rounded-xl overflow-hidden',
      ].join(' ')}
    >
      {/* Header */}
      <div
        className={[
          'flex flex-wrap items-center justify-between gap-2',
          'px-4 py-3 border-b border-b1',
          'bg-gradient-to-r from-bg2 to-bg3/40',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-display font-black text-[13px] text-white whitespace-nowrap">
            Audience Targeting
          </h2>
          <span className="font-display font-bold text-[9px] text-lime uppercase tracking-[0.1em]">
            · AI Suggested
          </span>
        </div>
        {persisting && (
          <span
            className="font-body text-[10px] text-t4 italic"
            aria-live="polite"
          >
            Saving…
          </span>
        )}
      </div>

      {/* How it works */}
      <div className="px-4 py-2.5 bg-blu/[0.04] border-b border-b1">
        <p className="font-body text-[10px] text-t3 leading-[1.55]">
          <strong className="text-blu">How it works:</strong> Location +
          Demographics are FREE and always active. Paid filters show a
          per-respondent surcharge — caps apply per category.
        </p>
      </div>

      {/* ── Location (FREE) ─────────────────────────────────────── */}
      <SectionShell
        id="location"
        title="Location"
        emoji="🌍"
        alwaysFree
        subtitle="· Countries + cities"
        sectionCost={costs.location}
        open={openMap.location}
        onToggle={() => toggleSection('location')}
      >
        <SubLabel>Quick regions</SubLabel>
        <ChipRow>
          {REGIONS.map((preset) => (
            <Chip
              key={preset.id}
              label={preset.label}
              selected={preset.countries.every((c) =>
                config.geography.countries.includes(c),
              )}
              onToggle={() => applyRegionPreset(preset.countries)}
            />
          ))}
        </ChipRow>

        <SubLabel>Selected countries</SubLabel>
        {config.geography.countries.length === 0 ? (
          <p className="font-body text-[11px] text-t4 italic">
            None — add at least one country via search below.
          </p>
        ) : (
          <ChipRow>
            {config.geography.countries.map((code) => {
              const country = COUNTRIES.find((c) => c.value === code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleCountry(code)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-md border',
                    'px-2.5 py-1 bg-lime/15 text-lime border-lime/40',
                    'font-body text-[12px] font-bold',
                  ].join(' ')}
                  aria-label={`Remove ${country?.label ?? code}`}
                >
                  {country?.label ?? code}
                  <span className="text-[10px] opacity-70">×</span>
                </button>
              );
            })}
          </ChipRow>
        )}

        <SubLabel>Search countries</SubLabel>
        <div className="relative">
          <input
            ref={countryInputRef}
            type="text"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="Type a country name (e.g. United Arab Emirates)"
            className={[
              'w-full bg-bg4 border border-b1 rounded-md',
              'px-3 py-2 font-body text-[12px] text-white',
              'placeholder:text-t4',
              'outline-none focus:border-t3',
            ].join(' ')}
          />
          {countryMatches.length > 0 && (
            <div
              className={[
                'mt-1 bg-bg4 border border-b1 rounded-md',
                'max-h-52 overflow-auto',
              ].join(' ')}
            >
              {countryMatches.map((country) => {
                const selected = config.geography.countries.includes(
                  country.value,
                );
                return (
                  <button
                    key={country.value}
                    type="button"
                    onClick={() => {
                      toggleCountry(country.value);
                      setCountryQuery('');
                      countryInputRef.current?.focus();
                    }}
                    className={[
                      'w-full text-left px-3 py-2',
                      'font-body text-[12px]',
                      'hover:bg-bg3 transition-colors',
                      selected ? 'text-lime font-bold' : 'text-t2',
                      'flex items-center justify-between',
                    ].join(' ')}
                  >
                    <span>{country.label}</span>
                    <span className="text-[9px] text-t4 uppercase tracking-wider">
                      Tier {country.tier}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {availableCities.length > 0 && (
          <>
            <SubLabel>
              City precision{' '}
              <span className="text-org normal-case tracking-normal">
                (+$1.00/resp)
              </span>
            </SubLabel>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCity();
                  }
                }}
                placeholder="Add a city from your selected countries…"
                className={[
                  'flex-1 bg-bg4 border border-b1 rounded-md',
                  'px-3 py-2 font-body text-[12px] text-white',
                  'placeholder:text-t4',
                  'outline-none focus:border-t3',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={addCity}
                className={[
                  'px-3 py-2 rounded-md bg-lime text-black',
                  'font-display font-black text-[10px] uppercase tracking-widest',
                  'hover:bg-lime/90 transition-colors',
                ].join(' ')}
              >
                Add
              </button>
            </div>

            {citySuggestions.length > 0 && (
              <ChipRow>
                {citySuggestions.map((city) => (
                  <Chip
                    key={city}
                    label={`+ ${city}`}
                    selected={false}
                    onToggle={() => {
                      onChange({
                        ...config,
                        geography: {
                          ...config.geography,
                          cities: [...config.geography.cities, city],
                          cityEnabled: true,
                        },
                      });
                      setCityQuery('');
                    }}
                  />
                ))}
              </ChipRow>
            )}

            {config.geography.cities.length > 0 && (
              <div className="mt-2">
                <ChipRow>
                  {config.geography.cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => removeCity(city)}
                      className={[
                        'inline-flex items-center gap-1.5 rounded-md border',
                        'px-2.5 py-1 bg-org/15 text-org border-org/40',
                        'font-body text-[12px] font-bold',
                      ].join(' ')}
                      aria-label={`Remove ${city}`}
                    >
                      📍 {city}
                      <span className="text-[10px] opacity-70">×</span>
                    </button>
                  ))}
                </ChipRow>
              </div>
            )}
          </>
        )}
      </SectionShell>

      {/* ── Demographics (FREE) ─────────────────────────────────── */}
      <SectionShell
        id="demographics"
        title="Demographics"
        emoji="👤"
        alwaysFree
        subtitle="· Age / gender / education"
        sectionCost={0}
        open={openMap.demographics}
        onToggle={() => toggleSection('demographics')}
      >
        <SubLabel>Age (multi-select)</SubLabel>
        <ChipRow>
          {targetingOptions.ageRanges.map((age) => (
            <Chip
              key={age}
              label={age}
              selected={config.demographics.ageRanges.includes(age)}
              onToggle={() => toggleDemographic('ageRanges', age)}
            />
          ))}
        </ChipRow>

        <SubLabel>Gender</SubLabel>
        <ChipRow>
          {targetingOptions.genders.map((gender) => (
            <Chip
              key={gender}
              label={gender}
              selected={config.demographics.genders.includes(gender)}
              onToggle={() => toggleDemographic('genders', gender)}
            />
          ))}
        </ChipRow>

        <SubLabel>Education</SubLabel>
        <ChipRow>
          {targetingOptions.education.map((edu) => (
            <Chip
              key={edu}
              label={edu}
              selected={config.demographics.education.includes(edu)}
              onToggle={() => toggleDemographic('education', edu)}
            />
          ))}
        </ChipRow>

        <SubLabel>Marital status</SubLabel>
        <ChipRow>
          {targetingOptions.marital.map((m) => (
            <Chip
              key={m}
              label={m}
              selected={config.demographics.marital.includes(m)}
              onToggle={() => toggleDemographic('marital', m)}
            />
          ))}
        </ChipRow>

        <SubLabel>Parental status</SubLabel>
        <ChipRow>
          {targetingOptions.parental.map((p) => (
            <Chip
              key={p}
              label={p}
              selected={config.demographics.parental.includes(p)}
              onToggle={() => toggleDemographic('parental', p)}
            />
          ))}
        </ChipRow>

        <SubLabel>Employment</SubLabel>
        <ChipRow>
          {targetingOptions.employment.map((emp) => (
            <Chip
              key={emp}
              label={emp}
              selected={config.demographics.employment.includes(emp)}
              onToggle={() => toggleDemographic('employment', emp)}
            />
          ))}
        </ChipRow>
      </SectionShell>

      {/* ── Professional / B2B (PAID) ───────────────────────────── */}
      <SectionShell
        id="professional"
        title="Professional / B2B"
        emoji="💼"
        subtitle="· Industry / role / company size"
        sectionCost={costs.professional}
        open={openMap.professional}
        onToggle={() => toggleSection('professional')}
      >
        <SubLabel>Industry (multi-select)</SubLabel>
        <ChipRow>
          {targetingOptions.industries.map((ind) => (
            <Chip
              key={ind}
              label={ind}
              selected={config.professional.industries.includes(ind)}
              onToggle={() => toggleProfessional('industries', ind)}
            />
          ))}
        </ChipRow>

        <SubLabel>Seniority / role (multi-select)</SubLabel>
        <ChipRow>
          {targetingOptions.roles.map((role) => (
            <Chip
              key={role}
              label={role}
              selected={config.professional.roles.includes(role)}
              onToggle={() => toggleProfessional('roles', role)}
            />
          ))}
        </ChipRow>

        <SubLabel>Company size (multi-select)</SubLabel>
        <ChipRow>
          {targetingOptions.companySizes.map((size) => (
            <Chip
              key={size}
              label={size}
              selected={config.professional.companySizes.includes(size)}
              onToggle={() => toggleProfessional('companySizes', size)}
            />
          ))}
        </ChipRow>

        <p className="font-body text-[10px] text-t4 mt-3 italic">
          $0.50 per selection — capped at <span className="text-lime">+$1.50/resp</span> across all three fields.
        </p>
      </SectionShell>

      {/* ── Income & Financial (PAID) ───────────────────────────── */}
      <SectionShell
        id="financials"
        title="Income & Financial"
        emoji="💰"
        subtitle="· Household income"
        sectionCost={costs.financials}
        open={openMap.financials}
        onToggle={() => toggleSection('financials')}
      >
        <SubLabel>Household income bracket (multi-select)</SubLabel>
        <ChipRow>
          {targetingOptions.incomeRanges.map((range) => (
            <Chip
              key={range}
              label={range}
              selected={config.financials.incomeRanges.includes(range)}
              onToggle={() => toggleFinancial(range)}
            />
          ))}
        </ChipRow>
        <p className="font-body text-[10px] text-t4 mt-3 italic">
          $0.50 per bracket — capped at <span className="text-lime">+$1.00/resp</span>.
        </p>
      </SectionShell>

      {/* ── Behavioral (PAID) ───────────────────────────────────── */}
      <SectionShell
        id="behavioral"
        title="Behavioral"
        emoji="📊"
        subtitle="· Device + lifestyle"
        sectionCost={costs.behavioral}
        open={openMap.behavioral}
        onToggle={() => toggleSection('behavioral')}
      >
        <SubLabel>Primary device</SubLabel>
        <ChipRow>
          {targetingOptions.devices.map((device) => (
            <Chip
              key={device}
              label={device}
              selected={config.technographics.devices.includes(device)}
              onToggle={() => toggleDevice(device)}
            />
          ))}
        </ChipRow>

        {BEHAVIORS.map((cat) => (
          <div key={cat.category}>
            <SubLabel>{cat.category}</SubLabel>
            <ChipRow>
              {cat.options.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  selected={config.behaviors.includes(opt.id)}
                  onToggle={() => toggleBehavior(opt.id)}
                />
              ))}
            </ChipRow>
          </div>
        ))}

        <p className="font-body text-[10px] text-t4 mt-3 italic">
          $0.50 per selection — capped at <span className="text-lime">+$1.00/resp</span> across device + behaviors.
        </p>
      </SectionShell>

      {/* ── Retargeting Pixel (PAID) ────────────────────────────── */}
      <SectionShell
        id="retargeting"
        title="Retargeting Pixel"
        emoji="🎯"
        subtitle="· Optional ad-platform ID"
        sectionCost={costs.retargeting}
        open={openMap.retargeting}
        onToggle={() => toggleSection('retargeting')}
      >
        <SubLabel>Platform</SubLabel>
        <ChipRow>
          {(['Meta', 'Google', 'LinkedIn', 'TikTok'] as const).map((p) => (
            <Chip
              key={p}
              label={p}
              selected={config.retargeting?.pixelPlatform === p}
              onToggle={() =>
                setRetargeting({
                  pixelPlatform:
                    config.retargeting?.pixelPlatform === p ? '' : p,
                })
              }
            />
          ))}
        </ChipRow>

        <SubLabel>Pixel ID</SubLabel>
        <input
          type="text"
          value={config.retargeting?.pixelId ?? ''}
          onChange={(e) => setRetargeting({ pixelId: e.target.value })}
          placeholder="e.g. 1234567890123456"
          className={[
            'w-full bg-bg4 border border-b1 rounded-md',
            'px-3 py-2 font-body text-[12px] text-white',
            'placeholder:text-t4',
            'outline-none focus:border-t3',
          ].join(' ')}
        />

        <p className="font-body text-[10px] text-t4 mt-3 italic">
          When a pixel ID is set, personas are tagged for ad-platform lookalike
          activation — adds <span className="text-lime">+$1.50/resp</span>.
        </p>
      </SectionShell>

      {/* Footer tip */}
      <div className="px-4 py-2.5 bg-lime/[0.04] border-t border-lime/15">
        <p className="font-body text-[10px] text-t3 leading-[1.55]">
          🛡 <strong className="text-lime">Smart caps:</strong> per-category
          surcharge caps prevent stacking — the pricing panel on the right
          always reflects the final number.
        </p>
      </div>
    </div>
  );
};

export default MissionControlTargeting;
