export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-10">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-900">Kestrel</span>
          <span aria-hidden="true">·</span>
          <span>© 2026 Kestrel Studio</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600">
          <a href="#services" className="hover:text-zinc-900 transition-colors">
            Services
          </a>
          <a href="#work" className="hover:text-zinc-900 transition-colors">
            Work
          </a>
          <a href="#process" className="hover:text-zinc-900 transition-colors">
            Process
          </a>
          <a href="#contact" className="hover:text-zinc-900 transition-colors">
            Contact
          </a>
          <a
            href="mailto:hello@kestrel.studio"
            className="hover:text-zinc-900 transition-colors"
          >
            hello@kestrel.studio
          </a>
        </div>
      </div>
    </footer>
  );
}
