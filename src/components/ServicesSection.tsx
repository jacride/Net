import { SERVICES } from '../data/studioData';

export function ServicesSection() {
  return (
    <section id="services" className="py-16 lg:py-24 border-b border-zinc-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-medium text-zinc-500 mb-2">Capabilities</p>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
            Focused engineering and interface design, from initial scope to launch.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <article
              key={service.index}
              className={`bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between ${
                service.wide ? 'md:col-span-2' : 'md:col-span-1'
              }`}
            >
              <div>
                <div className="text-sm font-mono tabular-nums text-zinc-500 mb-3">
                  {service.index}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-zinc-600 max-w-xl">
                  {service.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-100 text-xs font-medium text-zinc-500">
                {service.deliverableSummary}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
