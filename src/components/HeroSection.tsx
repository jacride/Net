import { ArrowRight } from 'lucide-react';
import { HERO_MEDIA, STUDIO_METRICS } from '../data/studioData';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onStartProject: () => void;
}

export function HeroSection({ onStartProject }: HeroSectionProps) {
  return (
    <section id="top" className="pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-zinc-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-4">
                Zurich · Copenhagen · Remote Product Engineering
              </p>
              <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold tracking-tight leading-[1.08] text-zinc-900 text-balance max-w-2xl">
                Software and websites built for clarity and speed.
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-600 max-w-xl">
                We design and engineer fast web applications, commerce storefronts, and
                modular design systems for teams that care about lasting craft.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={onStartProject}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 cursor-pointer"
              >
                <span>Start a Project</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#work"
                className="inline-flex items-center py-2.5 text-sm font-medium text-zinc-800 hover:text-blue-800 hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 rounded-sm"
              >
                Explore Selected Work
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[260px] sm:min-h-[340px] rounded-xl overflow-hidden border border-zinc-200 bg-white">
              <ResilientImage
                src={HERO_MEDIA.imageUrl}
                alt={HERO_MEDIA.imageAlt}
                fallbackTitle="Kestrel Architectural Studio"
                className="w-full h-full lg:h-full object-cover aspect-video lg:aspect-auto"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-16 pt-8 border-t border-zinc-200 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STUDIO_METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums">
                {metric.value}
              </div>
              <div className="mt-1 text-sm font-medium text-zinc-900">{metric.label}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{metric.context}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
