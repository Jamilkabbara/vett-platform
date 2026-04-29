import { ArrowRight, Download, Sparkles, Users, Trash2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { TopNav } from '../components/ui/TopNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { useToast } from '../components/ui/Toast';

/**
 * /__design — developer-only preview for every primitive in
 * src/components/ui/. Not linked from the app; only reachable by typing
 * the URL. Meant as a visual truth test against the prototype while we
 * rebuild pages in subsequent prompts.
 */
export function DesignSystemPreview() {
  const toast = useToast();

  return (
    <div className="min-h-screen bg-bg text-t1">
      <TopNav
        left={<Logo responsive />}
        center={
          <>
            <a href="#colors" className="font-display text-[13px] text-t2 hover:text-white transition-colors">Colors</a>
            <a href="#type" className="font-display text-[13px] text-t2 hover:text-white transition-colors">Type</a>
            <a href="#buttons" className="font-display text-[13px] text-t2 hover:text-white transition-colors">Buttons</a>
            <a href="#surfaces" className="font-display text-[13px] text-t2 hover:text-white transition-colors">Surfaces</a>
            <a href="#toasts" className="font-display text-[13px] text-t2 hover:text-white transition-colors">Toasts</a>
          </>
        }
        right={
          <>
            <Button variant="ghost" size="md">Docs</Button>
            <Button variant="gradient" size="md">Open app</Button>
          </>
        }
        mobileMenu={
          <>
            <a href="#colors" className="font-display text-[14px] text-t1 py-2">Colors</a>
            <a href="#type" className="font-display text-[14px] text-t1 py-2">Type</a>
            <a href="#buttons" className="font-display text-[14px] text-t1 py-2">Buttons</a>
            <a href="#surfaces" className="font-display text-[14px] text-t1 py-2">Surfaces</a>
            <a href="#toasts" className="font-display text-[14px] text-t1 py-2">Toasts</a>
            <Button variant="gradient" size="md" fullWidth>Open app</Button>
          </>
        }
      />

      <main className="max-w-6xl mx-auto px-4 md:px-10 py-10 md:py-16 space-y-16">
        {/* ── Intro ────────────────────────────────────────── */}
        <section>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border border-lime/30 text-lime font-display font-bold text-[10px] tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
            Design system v1
          </div>
          <h1 className="font-display font-black text-white leading-[1.02] tracking-display text-[clamp(36px,7vw,72px)]">
            VETT <span className="text-lime">primitives</span>
          </h1>
          <p className="mt-4 font-body text-t2 text-[15px] md:text-[17px] leading-relaxed max-w-2xl">
            Every token, surface, and control used across the app. This page
            renders from <code className="text-lime">src/components/ui/</code>
            {' '}and is the source of truth for visual consistency.
          </p>
        </section>

        {/* ── Colors ────────────────────────────────────────── */}
        <section id="colors" className="space-y-4">
          <SectionHeader tag="01" title="Color tokens" />
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[
              { name: 'bg', hex: '#0B0C15' },
              { name: 'bg2', hex: '#111827' },
              { name: 'bg3', hex: '#1a2233' },
              { name: 'bg4', hex: '#0d1117' },
              { name: 'b1', hex: '#1f2937' },
              { name: 'b2', hex: '#374151' },
              { name: 'lime', hex: '#BEF264' },
              { name: 'indigo', hex: '#6366F1' },
              { name: 'grn', hex: '#4ade80' },
              { name: 'red', hex: '#f87171' },
              { name: 'org', hex: '#fb923c' },
              { name: 'pur', hex: '#a78bfa' },
              { name: 'blu', hex: '#60a5fa' },
              { name: 't1', hex: '#e5e7eb' },
              { name: 't2', hex: '#9ca3af' },
              { name: 't3', hex: '#6b7280' },
            ].map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div
                  className="w-full aspect-square rounded-lg border border-b1"
                  style={{ background: c.hex }}
                />
                <div className="font-display font-bold text-[12px] text-white">{c.name}</div>
                <div className="font-body text-[11px] text-t3">{c.hex}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ────────────────────────────────────── */}
        <section id="type" className="space-y-4">
          <SectionHeader tag="02" title="Typography" />
          <Card className="space-y-6">
            <div>
              <p className="font-display text-[10px] font-bold text-lime tracking-widest uppercase mb-2">Display · Inter</p>
              <p className="font-display font-black text-white tracking-display text-[52px] leading-none">The quick lime fox</p>
            </div>
            <div>
              <p className="font-display text-[10px] font-bold text-lime tracking-widest uppercase mb-2">Heading · Inter 900</p>
              <p className="font-display font-black text-white tracking-tight-2 text-[28px] leading-tight">A punchy section headline</p>
            </div>
            <div>
              <p className="font-display text-[10px] font-bold text-lime tracking-widest uppercase mb-2">Body · Manrope</p>
              <p className="font-body text-t2 text-[15px] leading-relaxed max-w-xl">
                Manrope handles prose and UI labels. It pairs well with Inter
                display headings because both favor geometric strokes and open
                counters.
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] font-bold text-lime tracking-widest uppercase mb-2">Mono inline</p>
              <p className="font-body text-t2 text-[13px]">
                Use <code className="font-mono text-lime">text-[13px]</code> for small labels.
              </p>
            </div>
          </Card>
        </section>

        {/* ── Logo variants ─────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeader tag="03" title="Logo" />
          <Card className="flex flex-wrap items-end gap-8">
            <div className="flex flex-col gap-2">
              <Logo size="sm" />
              <span className="font-body text-[11px] text-t3">size=&quot;sm&quot;</span>
            </div>
            <div className="flex flex-col gap-2">
              <Logo size="md" />
              <span className="font-body text-[11px] text-t3">size=&quot;md&quot; (default)</span>
            </div>
            <div className="flex flex-col gap-2">
              <Logo size="lg" />
              <span className="font-body text-[11px] text-t3">size=&quot;lg&quot;</span>
            </div>
            <div className="flex flex-col gap-2">
              <Logo size="md" iconOnly />
              <span className="font-body text-[11px] text-t3">iconOnly</span>
            </div>
            <div className="flex flex-col gap-2">
              <Logo responsive />
              <span className="font-body text-[11px] text-t3">responsive (resize viewport)</span>
            </div>
          </Card>
        </section>

        {/* ── Buttons ───────────────────────────────────────── */}
        <section id="buttons" className="space-y-4">
          <SectionHeader tag="04" title="Buttons" />
          <Card className="space-y-6">
            <Row label="Variants">
              <Button variant="primary">Primary</Button>
              <Button variant="gradient">Vett it</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
            </Row>
            <Row label="Sizes">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row label="With icons">
              <Button leftIcon={<Sparkles className="w-4 h-4" />}>Generate</Button>
              <Button variant="gradient" rightIcon={<ArrowRight className="w-4 h-4" />}>Continue</Button>
              <Button variant="ghost" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
            </Row>
            <Row label="States">
              <Button loading>Saving…</Button>
              <Button disabled>Disabled</Button>
              <Button rounded="lg">rounded=&quot;lg&quot;</Button>
            </Row>
            <Row label="Full width">
              <div className="w-full max-w-sm">
                <Button variant="gradient" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Full-width CTA
                </Button>
              </div>
            </Row>
          </Card>
        </section>

        {/* ── Cards + KPIs ──────────────────────────────────── */}
        <section id="surfaces" className="space-y-4">
          <SectionHeader tag="05" title="Cards & KPIs" />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="font-display font-bold text-white text-[15px] mb-1">Default card</p>
              <p className="font-body text-t2 text-[13px]">bg2 surface, b1 border, 14px radius.</p>
            </Card>
            <Card hover>
              <p className="font-display font-bold text-white text-[15px] mb-1">Hover card</p>
              <p className="font-body text-t2 text-[13px]">Border and bg lift on pointer-over.</p>
            </Card>
            <Card elevated>
              <p className="font-display font-bold text-white text-[15px] mb-1">Elevated card</p>
              <p className="font-body text-t2 text-[13px]">shadow-float for modals / hero panels.</p>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <KpiCard label="Responses" value="1,284" sub="+12% vs last mission" icon={<Users className="w-4 h-4" />} />
            <KpiCard label="Completion rate" value="94%" valueColor="grn" sub="Target 85%" />
            <KpiCard label="Avg. time" value="2m 14s" valueColor="white" sub="Across 5 questions" />
            <KpiCard label="Overage" value="$12.40" valueColor="red" sub="3 missions this month" />
          </div>
        </section>

        {/* ── Toasts ────────────────────────────────────────── */}
        <section id="toasts" className="space-y-4">
          <SectionHeader tag="06" title="Toasts" />
          <Card className="space-y-4">
            <p className="font-body text-t2 text-[13px]">
              Calls a no-op outside <code className="text-lime">ToastProvider</code>. Once
              wired in <code className="text-lime">main.tsx</code>, buttons below will
              render real toasts.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => toast.success('Mission launched')}>
                success
              </Button>
              <Button variant="danger" size="sm" onClick={() => toast.error('Something went wrong')}>
                error
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.info('Heads up - new feature')}>
                info
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                const id = toast.loading('Saving draft…');
                setTimeout(() => toast.update(id, { type: 'success', message: 'Saved!' }), 1500);
              }}>
                loading → success
              </Button>
            </div>
          </Card>
        </section>

        {/* ── Responsive reference ──────────────────────────── */}
        <section className="space-y-4">
          <SectionHeader tag="07" title="Responsive" />
          <Card className="space-y-3">
            <p className="font-body text-t2 text-[13px]">
              Resize the viewport to verify each breakpoint. Reference frames:
            </p>
            <ul className="font-body text-t2 text-[13px] space-y-1 list-disc list-inside marker:text-lime">
              <li><span className="text-white">375px</span> - mobile: Logo 36px, hamburger menu, stacked buttons.</li>
              <li><span className="text-white">768px</span> - tablet: desktop nav unlocks, padding 40px.</li>
              <li><span className="text-white">1024px</span> - desktop: multi-column grids fill.</li>
              <li><span className="text-white">1280px+</span> - large: hero clamp caps at 72px, KPI row = 4 columns.</li>
            </ul>
          </Card>
        </section>

        {/* ── Footer strip ──────────────────────────────────── */}
        <footer className="pt-8 border-t border-b1 text-center">
          <p className="font-body text-t3 text-[12px]">
            Internal preview route — not linked from the app.
          </p>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-display font-bold text-[11px] text-lime tracking-widest">{tag}</span>
      <h2 className="font-display font-black text-white text-[clamp(22px,4vw,32px)] tracking-tight-2">
        {title}
      </h2>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-display font-bold text-[11px] text-t3 uppercase tracking-widest">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default DesignSystemPreview;
