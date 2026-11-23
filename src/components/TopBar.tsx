import { Download } from 'lucide-react';

interface TopBarProps {
  onExportPack: () => void;
  isExporting: boolean;
}

export function TopBar({ onExportPack, isExporting }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E3DC] bg-[#FFFFFF]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5 lg:px-10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio"
          className="font-display text-lg font-bold tracking-tight text-[#141413] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C84B31]"
        >
          Presshouse
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5E5D59]"
        >
          <a
            href="#studio"
            className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            Studio
          </a>
          <a
            href="#variations"
            className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            5 Variations
          </a>
          <a
            href="#editor"
            className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            Prompt Editor
          </a>
          <a
            href="#export"
            className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            Print Export
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportPack}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#141413] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2B2B29] disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C84B31]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isExporting ? 'Packaging...' : 'Export Print Pack'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
