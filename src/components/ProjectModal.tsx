import { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { ProjectItem } from '../data/studioData';
import { ResilientImage } from './ResilientImage';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onInquireSimilar: (project: ProjectItem) => void;
}

export function ProjectModal({
  project,
  onClose,
  onInquireSimilar,
}: ProjectModalProps) {
  useEffect(() => {
    if (!project) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <span>{project.client}</span>
              <span aria-hidden="true">·</span>
              <span>{project.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{project.year}</span>
            </div>
            <h3
              id="project-modal-title"
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              {project.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${project.title} details`}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="w-full h-56 sm:h-64 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
            <ResilientImage
              src={project.imageUrl}
              alt={project.imageAlt}
              fallbackTitle={project.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="py-3.5 border-y border-zinc-200">
            <div className="text-xs font-medium text-zinc-500 mb-1">Measured Outcome</div>
            <div className="text-base font-semibold text-zinc-900">{project.outcome}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-1.5">The Challenge</h4>
              <p className="text-sm leading-relaxed text-zinc-600">{project.challenge}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-1.5">Engineering Approach</h4>
              <p className="text-sm leading-relaxed text-zinc-600">{project.solution}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-zinc-500">
              {project.deliverables.join(' · ')}
            </div>

            <button
              type="button"
              onClick={() => onInquireSimilar(project)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
            >
              <span>Discuss a Similar Build</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
