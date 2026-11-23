import { ArrowUpRight } from 'lucide-react';
import type { ProjectCategory, ProjectItem } from '../data/studioData';
import { ResilientImage } from './ResilientImage';

interface WorkSectionProps {
  projects: ProjectItem[];
  activeCategory: ProjectCategory;
  onSelectCategory: (category: ProjectCategory) => void;
  onOpenProject: (project: ProjectItem) => void;
}

const CATEGORIES: ProjectCategory[] = ['All', 'Web Apps', 'Commerce', 'Systems'];

export function WorkSection({
  projects,
  activeCategory,
  onSelectCategory,
  onOpenProject,
}: WorkSectionProps) {
  return (
    <section id="work" className="py-16 lg:py-24 border-b border-zinc-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-zinc-500 mb-2">Selected Work</p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
              Recent launches with measurable operational impact.
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter projects by category"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-zinc-100 border border-zinc-200 rounded-lg self-start md:self-auto"
          >
            {CATEGORIES.map((category) => {
              const isSelected = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectCategory(category)}
                  className={`px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-800 ${
                    isSelected
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="border border-zinc-200 rounded-xl p-12 text-center bg-zinc-50">
            <p className="text-base font-medium text-zinc-900">
              No case studies match this filter yet.
            </p>
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-800 hover:underline cursor-pointer"
            >
              Show all projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-testid="project-grid">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100 border-b border-zinc-200">
                  <ResilientImage
                    src={project.imageUrl}
                    alt={project.imageAlt}
                    fallbackTitle={project.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                      <span>{project.client}</span>
                      <span aria-hidden="true">·</span>
                      <span>{project.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{project.year}</span>
                    </div>

                    <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2">
                      {project.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-zinc-600 mb-4">
                      {project.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 flex items-end justify-between gap-4">
                    <p className="text-xs font-medium text-zinc-900 leading-snug">
                      {project.outcome}
                    </p>

                    <button
                      type="button"
                      onClick={() => onOpenProject(project)}
                      aria-label={`Inspect case study: ${project.title}`}
                      className="inline-flex items-center gap-1 px-3 py-2 min-h-[36px] text-xs font-medium text-blue-800 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                    >
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
