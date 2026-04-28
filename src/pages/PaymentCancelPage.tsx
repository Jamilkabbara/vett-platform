/**
 * Pass 23 Bug 23.0e v2 — Stripe Checkout cancel landing page.
 *
 * URL shape:
 *   /payment-cancel?mission_id=<uuid>      (mission flow)
 *   /payment-cancel?kind=chat_overage&return=<url>  (chat overage)
 *
 * Behaviour:
 *   - Shows reassuring "Checkout canceled. Your mission is saved as a draft."
 *   - Mission flow: CTAs to return to the mission or view all missions.
 *   - Chat overage: a single "Back to chat" CTA bouncing to ?return=.
 *   - Fires funnel event 'checkout_canceled' for analytics.
 */
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { trackFunnel } from '../lib/funnelTrack';

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const missionId = searchParams.get('mission_id');
  const kind = searchParams.get('kind') || 'mission';
  const returnUrl = searchParams.get('return');

  useEffect(() => {
    trackFunnel('checkout_canceled', {
      kind,
      mission_id: missionId,
    }, { mission_id: missionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-white/5 mb-4">
          <X className="w-8 h-8 text-white/60" />
        </div>
        <h1 className="text-white text-xl font-black mb-2">Checkout canceled</h1>
        <p className="text-white/70 text-sm leading-relaxed mb-6">
          {kind === 'chat_overage'
            ? 'No worries. You can buy more chat messages anytime.'
            : 'No worries. Your mission is saved as a draft and ready when you are.'}
        </p>

        <div className="flex flex-col gap-2">
          {kind === 'chat_overage' && returnUrl && (
            <button
              onClick={() => { window.location.href = returnUrl; }}
              className="w-full py-3 px-4 rounded-lg bg-primary text-gray-900 hover:opacity-90 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to chat
            </button>
          )}

          {kind !== 'chat_overage' && missionId && (
            <button
              onClick={() => navigate(`/dashboard/${missionId}`)}
              className="w-full py-3 px-4 rounded-lg bg-primary text-gray-900 hover:opacity-90 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to mission
            </button>
          )}

          <button
            onClick={() => navigate('/missions')}
            className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-sm transition-colors"
          >
            View all missions
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
