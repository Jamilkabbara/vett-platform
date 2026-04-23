import { Headphones } from 'lucide-react';

export const AdminSupport = ({ apiFetch: _apiFetch }: { apiFetch: (path: string, opts?: RequestInit) => Promise<Response> }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center mb-4">
      <Headphones className="w-7 h-7 text-blue-400" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">Support Tickets</h3>
    <p className="text-sm text-gray-500 max-w-xs">Support ticket management is coming in a future release. Connect Intercom or build the tickets table to enable this tab.</p>
    <span className="mt-4 inline-block px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-400 font-bold">Coming soon</span>
  </div>
);
