import { CreditCard, Plus, Trash2, Apple } from 'lucide-react';
import toast from 'react-hot-toast';

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// Demo data — replace with real Stripe PM list when endpoint is wired
const DEMO_CARDS: SavedCard[] = [];

const BRAND_COLORS: Record<string, string> = {
  visa:       'from-blue-600 to-blue-700',
  mastercard: 'from-red-500 to-orange-500',
  amex:       'from-green-600 to-teal-600',
  discover:   'from-orange-500 to-amber-500',
};

export const PaymentMethodsTab = () => {
  const cards = DEMO_CARDS;

  const handleAdd = () => {
    toast('Add card coming soon — use your saved card at checkout', { icon: '💳' });
  };

  const handleRemove = (last4: string) => {
    toast.error(`Remove card ending in ${last4} — contact support`);
  };

  return (
    <div className="space-y-6">
      {/* Saved cards */}
      {cards.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-400">No saved payment methods</p>
          <p className="text-sm mt-1">Your card is saved securely via Stripe at checkout</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <div
              key={card.id}
              className="flex items-center justify-between p-5 bg-[#1e293b] border border-gray-700 rounded-2xl hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-8 bg-gradient-to-br ${BRAND_COLORS[card.brand] || 'from-gray-600 to-gray-700'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold capitalize">
                    {card.brand} •••• {card.last4}
                    {card.isDefault && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5 font-bold">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Expires {card.expMonth}/{card.expYear}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(card.last4)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                title="Remove card"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apple Pay row */}
      <div className="flex items-center justify-between p-5 bg-[#1e293b] border border-gray-700 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-600">
            <Apple className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">Apple Pay</p>
            <p className="text-xs text-gray-500 mt-0.5">Available at checkout on supported devices</p>
          </div>
        </div>
        <span className="text-xs text-gray-500 font-medium">Auto-detected</span>
      </div>

      {/* Add card */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2.5 py-4 bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30 hover:border-primary/50 text-primary font-bold rounded-2xl transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Payment Method
      </button>

      <p className="text-xs text-center text-gray-600">
        Cards are stored securely by Stripe. VETT never sees raw card numbers.
      </p>
    </div>
  );
};
