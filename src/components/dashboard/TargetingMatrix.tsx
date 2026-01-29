import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Briefcase, Target } from 'lucide-react';

export interface TargetingConfig {
  geography: {
    country: string;
    city: string;
  };
  demographics: {
    gender: 'all' | 'male' | 'female';
    ageRanges: string[];
  };
  professional: {
    occupations: string[];
    employmentStatus: string[];
  };
  behavior: {
    tags: string[];
  };
}

interface TargetingMatrixProps {
  onTargetingChange?: (config: TargetingConfig) => void;
  respondentCount?: number;
  onRespondentCountChange?: (count: number) => void;
}

export const TargetingMatrix = ({ onTargetingChange, respondentCount = 100, onRespondentCountChange }: TargetingMatrixProps) => {
  const [config, setConfig] = useState<TargetingConfig>({
    geography: {
      country: 'Global',
      city: 'All',
    },
    demographics: {
      gender: 'all',
      ageRanges: ['all'],
    },
    professional: {
      occupations: [],
      employmentStatus: [],
    },
    behavior: {
      tags: [],
    },
  });

  const updateConfig = (newConfig: TargetingConfig) => {
    setConfig(newConfig);
    onTargetingChange?.(newConfig);
  };

  const handleCountryChange = (country: string) => {
    updateConfig({ ...config, geography: { ...config.geography, country } });
  };

  const handleCityChange = (city: string) => {
    updateConfig({ ...config, geography: { ...config.geography, city } });
  };

  const handleGenderChange = (gender: 'all' | 'male' | 'female') => {
    updateConfig({ ...config, demographics: { ...config.demographics, gender } });
  };

  const handleAgeToggle = (age: string) => {
    let newAges: string[];
    if (age === 'all') {
      newAges = ['all'];
    } else {
      if (config.demographics.ageRanges.includes('all')) {
        newAges = [age];
      } else if (config.demographics.ageRanges.includes(age)) {
        newAges = config.demographics.ageRanges.filter(a => a !== age);
        if (newAges.length === 0) newAges = ['all'];
      } else {
        newAges = [...config.demographics.ageRanges.filter(a => a !== 'all'), age];
      }
    }
    updateConfig({ ...config, demographics: { ...config.demographics, ageRanges: newAges } });
  };

  const handleOccupationToggle = (occupation: string) => {
    const current = config.professional.occupations;
    const updated = current.includes(occupation)
      ? current.filter(o => o !== occupation)
      : [...current, occupation];
    updateConfig({ ...config, professional: { ...config.professional, occupations: updated } });
  };

  const handleEmploymentToggle = (status: string) => {
    const current = config.professional.employmentStatus;
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    updateConfig({ ...config, professional: { ...config.professional, employmentStatus: updated } });
  };

  const handleBehaviorToggle = (tag: string) => {
    const current = config.behavior.tags;
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    updateConfig({ ...config, behavior: { ...config.behavior, tags: updated } });
  };

  const countries = ['Global', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Dubai', 'Singapore', 'Japan', 'India'];
  const ageOptions = ['all', '18-24', '25-34', '35-44', '45+'];
  const occupations = ['IT/Tech', 'Healthcare', 'Marketing', 'Finance', 'Education', 'Retail', 'Manufacturing'];
  const employmentStatuses = ['Full-Time', 'Part-Time', 'Freelance', 'Student', 'Unemployed'];
  const behaviorTags = ['Early Adopter', 'Price Sensitive', 'Quality Focused', 'Eco-Conscious', 'Brand Loyal'];

  const hasNicheTargeting = config.geography.city !== 'All' || config.professional.occupations.length > 0;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 h-full overflow-y-auto max-h-[800px]">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-black text-white">Targeting Matrix</h3>
      </div>

      {onRespondentCountChange && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Respondents
            </label>
            <div className="text-right">
              <div className="text-2xl font-black text-primary">{respondentCount}</div>
              <div className="text-xs text-white/40">
                {respondentCount > 1000 ? '24 Hours' : respondentCount > 500 ? '12 Hours' : '4 Hours'}
              </div>
            </div>
          </div>
          <input
            type="range"
            min="10"
            max="2000"
            step="10"
            value={respondentCount}
            onChange={(e) => onRespondentCountChange(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((respondentCount - 10) / 1990) * 100}%, rgba(255,255,255,0.1) ${((respondentCount - 10) / 1990) * 100}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>10</span>
            <span>2,000</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Geography
            </label>
          </div>
          <div className="space-y-3 pl-6">
            <div>
              <label className="text-xs text-white/50 mb-2 block">Country</label>
              <select
                value={config.geography.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
              >
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-2 block">City/Region (Niche +$0.50/user)</label>
              <input
                type="text"
                value={config.geography.city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="All (or specify city)"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-neon-lime" />
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Demographics
            </label>
          </div>
          <div className="space-y-3 pl-6">
            <div>
              <label className="text-xs text-white/50 mb-2 block">Gender</label>
              <div className="flex gap-2">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleGenderChange(option.value as 'all' | 'male' | 'female')}
                    className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                      config.demographics.gender === option.value
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-2 block">Age Range (Multi-Select)</label>
              <div className="flex flex-wrap gap-2">
                {ageOptions.map((age) => {
                  const isSelected = config.demographics.ageRanges.includes(age);
                  const label = age === 'all' ? 'All Ages' : age;
                  return (
                    <motion.button
                      key={age}
                      onClick={() => handleAgeToggle(age)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-neon-lime text-gray-900 shadow-lg shadow-neon-lime/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Professional (Niche +$0.50/user)
            </label>
          </div>
          <div className="space-y-3 pl-6">
            <div>
              <label className="text-xs text-white/50 mb-2 block">Occupation</label>
              <div className="flex flex-wrap gap-2">
                {occupations.map((occ) => {
                  const isSelected = config.professional.occupations.includes(occ);
                  return (
                    <button
                      key={occ}
                      onClick={() => handleOccupationToggle(occ)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {occ}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-2 block">Employment Status</label>
              <div className="flex flex-wrap gap-2">
                {employmentStatuses.map((status) => {
                  const isSelected = config.professional.employmentStatus.includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => handleEmploymentToggle(status)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-orange-400" />
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Behavioral Tags
            </label>
          </div>
          <div className="pl-6">
            <div className="flex flex-wrap gap-2">
              {behaviorTags.map((tag) => {
                const isSelected = config.behavior.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleBehaviorToggle(tag)}
                    className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-orange-500/30 text-orange-300 border border-orange-400/50'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl p-4 border ${
            hasNicheTargeting
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-primary/10 border-primary/20'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className={hasNicheTargeting ? 'text-orange-400' : 'text-primary'}>
              Current Targeting
            </span>
            {hasNicheTargeting && (
              <span className="bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full text-[10px]">
                NICHE
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs text-white/80">
            <div>
              <span className="text-white/50">Location:</span>{' '}
              <span className="font-bold">
                {config.geography.country}
                {config.geography.city !== 'All' && ` > ${config.geography.city}`}
              </span>
            </div>
            <div>
              <span className="text-white/50">Gender:</span>{' '}
              <span className="font-bold capitalize">{config.demographics.gender}</span>
            </div>
            <div>
              <span className="text-white/50">Age:</span>{' '}
              <span className="font-bold">
                {config.demographics.ageRanges.includes('all') ? 'All Ages' : config.demographics.ageRanges.join(', ')}
              </span>
            </div>
            {config.professional.occupations.length > 0 && (
              <div>
                <span className="text-white/50">Occupation:</span>{' '}
                <span className="font-bold">{config.professional.occupations.join(', ')}</span>
              </div>
            )}
            {config.professional.employmentStatus.length > 0 && (
              <div>
                <span className="text-white/50">Employment:</span>{' '}
                <span className="font-bold">{config.professional.employmentStatus.join(', ')}</span>
              </div>
            )}
            {config.behavior.tags.length > 0 && (
              <div>
                <span className="text-white/50">Behavior:</span>{' '}
                <span className="font-bold">{config.behavior.tags.join(', ')}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
