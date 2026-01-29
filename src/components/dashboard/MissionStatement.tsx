import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, X } from 'lucide-react';

interface MissionStatementProps {
  initialObjective: string;
  onObjectiveChange?: (objective: string) => void;
}

export const MissionStatement = ({ initialObjective, onObjectiveChange }: MissionStatementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [objective, setObjective] = useState(initialObjective);
  const [editText, setEditText] = useState(initialObjective);

  const handleEdit = () => {
    setEditText(objective);
    setIsEditing(true);
  };

  const handleSave = () => {
    setObjective(editText);
    setIsEditing(false);
    onObjectiveChange?.(editText);
  };

  const handleCancel = () => {
    setEditText(objective);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-6 border border-primary/20 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          Mission Objective
        </h3>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-black/40 border border-primary/40 rounded-lg p-4 text-white focus:ring-2 focus:ring-primary outline-none resize-none font-medium"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-bold"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-bold"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <p className="text-white/90 font-medium leading-relaxed text-lg flex-1">
            {objective}
          </p>
          <button
            onClick={handleEdit}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            title="Edit Mission Objective"
          >
            <Edit2 className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </motion.div>
  );
};
