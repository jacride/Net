import { PROCESS_STEPS } from '../data/studioData';

export function ProcessSection() {
  return (
    <section id="process" className="py-16 lg:py-24 border-b border-zinc-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-medium text-zinc-500 mb-2">How We Work</p>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
            Direct collaboration with weekly browser-verified releases.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROCESS_STEPS.map((step) => (
            <div key={step.index} className="pt-6 border-t border-zinc-300">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-sm font-mono tabular-nums text-zinc-500">
                  {step.index}
                </span>
                <span className="text-xs font-medium text-zinc-500 font-mono tabular-nums">
                  {step.timeframe}
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
