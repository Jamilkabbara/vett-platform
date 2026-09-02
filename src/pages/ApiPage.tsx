import { Link } from 'react-router-dom';
import { OverlayPage } from '../components/layout/OverlayPage';
import { Code, Clock, Zap } from 'lucide-react';

/**
 * /api — PLANNED, not shipped.
 *
 * This page previously advertised "VETT API v1.0", a "Closed Beta" you could
 * apply to, and a worked `POST /v1/missions` request. No /v1/ route exists in
 * the backend and there is no beta to be invited to, so every concrete promise
 * on the page was unfulfillable. The dead "Request API Access" button had no
 * handler at all, under copy promising a reply within 48 hours.
 *
 * The page is kept rather than deleted because its URL is published in
 * sitemap.xml and public/llms.txt; removing it would 404 a linked route.
 * What it may NOT do is describe an endpoint. No paths, no verbs, no request
 * or response shapes, no version number, and no timeline — nothing a reader
 * could build against or hold us to. When the API is real, this page gets a
 * spec back.
 */
export const ApiPage = () => {
  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            VETT API
          </h1>
          <p className="text-white/60 text-xl">
            Planned. Not available yet.
          </p>
        </div>

        <div className="glass-panel p-12 rounded-3xl mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Not yet released</h2>
              <p className="text-white/60">There is no public API today</p>
            </div>
          </div>

          <p className="text-white/80 text-lg leading-relaxed mb-8">
            There is currently no VETT API. No endpoints are live, there is no
            beta programme, and we are not publishing a timeline. Everything
            VETT does today runs through the web product, where you can set up
            a mission, watch it run, and export the results as PDF, PPTX, XLSX,
            CSV or JSON.
          </p>

          <p className="text-white/60 text-base leading-relaxed mb-8">
            When we do build it, the shape below is the direction we expect to
            take. Treat it as intent, not as a specification, and do not build
            against it.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="text-white font-black uppercase tracking-wider text-sm">
                  Intended: REST
                </h3>
              </div>
              <p className="text-white/60 text-sm">
                Create and read missions programmatically, using the same
                methodologies as the web product
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-white font-black uppercase tracking-wider text-sm">
                  Intended: Webhooks
                </h3>
              </div>
              <p className="text-white/60 text-sm">
                A callback when a mission finishes, instead of polling
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white/60 text-base mb-6">
            If an API is what would make VETT work for you, tell us. It genuinely
            affects what we build next.
          </p>
          <Link
            to="/contact"
            className="inline-block px-12 py-6 rounded-full font-black text-base uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:shadow-[0_0_60px_rgba(99,102,241,0.8)] transition-all duration-500 hover:scale-105"
          >
            Tell us what you need
          </Link>
          <p className="text-white/40 text-sm mt-6">
            We read everything that comes in. We cannot promise a delivery date
            for the API, so we are not going to give you one.
          </p>
        </div>
      </div>
    </OverlayPage>
  );
};
