import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin } from 'lucide-react';

interface TargetingConfig {
  gender: 'all' | 'male' | 'female';
  ageRanges: string[];
  location: string;
}

interface TargetingPanelProps {
  onTargetingChange?: (config: TargetingConfig) => void;
}

export const TargetingPanel = ({ onTargetingChange }: TargetingPanelProps) => {
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [ageRanges, setAgeRanges] = useState<string[]>(['all']);
  const [location, setLocation] = useState('Global');

  const ageOptions = [
    { label: 'All Ages', value: 'all' },
    { label: '18-24', value: '18-24' },
    { label: '25-34', value: '25-34' },
    { label: '35-44', value: '35-44' },
    { label: '45+', value: '45+' },
  ];

  const locationOptions = [
    'Global',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Dubai',
    'Singapore',
    'Japan',
    'India',
  ];

  const handleGenderChange = (value: 'all' | 'male' | 'female') => {
    setGender(value);
    onTargetingChange?.({ gender: value, ageRanges, location });
  };

  const handleAgeToggle = (value: string) => {
    let newAges: string[];
    if (value === 'all') {
      newAges = ['all'];
    } else {
      if (ageRanges.includes('all')) {
        newAges = [value];
      } else if (ageRanges.includes(value)) {
        newAges = ageRanges.filter(a => a !== value);
        if (newAges.length === 0) {
          newAges = ['all'];
        }
      } else {
        newAges = [...ageRanges.filter(a => a !== 'all'), value];
      }
    }
    setAgeRanges(newAges);
    onTargetingChange?.({ gender, ageRanges: newAges, location });
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onTargetingChange?.({ gender, ageRanges, location: value });
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10 h-full">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg sm:text-xl font-black text-white">Define Your Audience</h3>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-white/70 mb-2 sm:mb-3 uppercase tracking-wider">
            Gender
          </label>
          <div className="flex gap-1.5 sm:gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleGenderChange(option.value as 'all' | 'male' | 'female')}
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  gender === option.value
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
          <label className="block text-xs sm:text-sm font-bold text-white/70 mb-2 sm:mb-3 uppercase tracking-wider">
            Age Range
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {ageOptions.map((option) => {
              const isSelected = ageRanges.includes(option.value);
              return (
                <motion.button
                  key={option.value}
                  onClick={() => handleAgeToggle(option.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${
                    isSelected
                      ? 'bg-neon-lime text-gray-900 shadow-lg shadow-neon-lime/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {option.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-white/70 mb-2 sm:mb-3 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </label>
          <select
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:border-white/20 transition-colors"
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc} className="bg-gray-900">
                {loc}
              </option>
            ))}
          </select>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4"
        >
          <div className="text-[10px] sm:text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            Current Targeting
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-white/80">
            <div>
              <span className="text-white/50">Gender:</span>{' '}
              <span className="font-bold capitalize">{gender}</span>
            </div>
            <div>
              <span className="text-white/50">Age:</span>{' '}
              <span className="font-bold">
                {ageRanges.includes('all') ? 'All Ages' : ageRanges.join(', ')}
              </span>
            </div>
            <div>
              <span className="text-white/50">Location:</span>{' '}
              <span className="font-bold">{location}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
