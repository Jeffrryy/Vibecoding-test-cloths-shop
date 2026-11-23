import { useState } from 'react';
import { Download, Eye, EyeOff, Layers, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import type { InkTreatment, LogoAsset, ProductSpec } from '../types/merch';

export type ViewportMode = 'placement' | 'ai-render' | 'proof';

interface StudioViewportProps {
  logo: LogoAsset | null;
  product: ProductSpec;
  garmentColorName: string;
  printFinish: string;
  inkTreatment: InkTreatment;
  scalePct: number;
  offsetXPct: number;
  offsetYPct: number;
  showPrintGuides: boolean;
  onToggleGuides: () => void;
  viewportMode: ViewportMode;
  onChangeMode: (mode: ViewportMode) => void;
  aiRenderUrl: string | null;
  aiRenderNote: string | null;
  isGeneratingMockup: boolean;
  proofPreviewUrl: string | null;
  onGenerateMockup: () => void;
  onSendToEditor: (imageUrl: string) => void;
  onDownloadActiveRender: () => void;
}

function getInkFilterStyle(treatment: InkTreatment): string {
  switch (treatment) {
    case 'charcoal':
      return 'brightness(0) saturate(100%) opacity(0.92)';
    case 'chalk':
      return 'brightness(0) invert(1) opacity(0.95)';
    case 'vermilion':
      return 'sepia(100%) saturate(450%) hue-rotate(-14deg) brightness(0.88)';
    case 'halftone':
      return 'grayscale(100%) contrast(135%) opacity(0.86)';
    default:
      return 'none';
  }
}

export function StudioViewport({
  logo,
  product,
  garmentColorName,
  printFinish,
  inkTreatment,
  scalePct,
  offsetXPct,
  offsetYPct,
  showPrintGuides,
  onToggleGuides,
  viewportMode,
  onChangeMode,
  aiRenderUrl,
  aiRenderNote,
  isGeneratingMockup,
  proofPreviewUrl,
  onGenerateMockup,
  onSendToEditor,
  onDownloadActiveRender,
}: StudioViewportProps) {
  const [imgError, setImgError] = useState(false);

  const pxWidth = Math.round(product.printWidthIn * product.dpi);
  const pxHeight = Math.round(product.printHeightIn * product.dpi);

  const activeCanvasImage =
    viewportMode === 'ai-render' && aiRenderUrl
      ? aiRenderUrl
      : viewportMode === 'proof' && proofPreviewUrl
      ? proofPreviewUrl
      : product.blankImageUrl;

  return (
    <div className="flex flex-col rounded-xl border border-[#E5E3DC] bg-[#FFFFFF]">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E3DC] px-5 py-3.5">
        <div className="flex items-center gap-1 rounded-lg bg-[#F4F3EE] p-1">
          <button
            type="button"
            onClick={() => onChangeMode('placement')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewportMode === 'placement'
                ? 'bg-[#FFFFFF] text-[#141413] shadow-xs'
                : 'text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            Placement Guide
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('ai-render')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewportMode === 'ai-render'
                ? 'bg-[#FFFFFF] text-[#141413] shadow-xs'
                : 'text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            AI Mockup Render
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('proof')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewportMode === 'proof'
                ? 'bg-[#FFFFFF] text-[#141413] shadow-xs'
                : 'text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            Press Proof
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewportMode === 'placement' && (
            <button
              type="button"
              onClick={onToggleGuides}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] transition-colors whitespace-nowrap shrink-0"
            >
              {showPrintGuides ? (
                <EyeOff className="h-3.5 w-3.5 text-[#5E5D59]" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-[#5E5D59]" aria-hidden="true" />
              )}
              <span>{showPrintGuides ? 'Hide Safe Zone' : 'Show Safe Zone'}</span>
            </button>
          )}

          {viewportMode === 'ai-render' && aiRenderUrl && (
            <>
              <button
                type="button"
                onClick={() => onSendToEditor(aiRenderUrl)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] transition-colors whitespace-nowrap shrink-0"
              >
                <Wand2 className="h-3.5 w-3.5 text-[#C84B31]" aria-hidden="true" />
                <span>Refine in Editor</span>
              </button>
              <button
                type="button"
                onClick={onDownloadActiveRender}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-[#5E5D59]" aria-hidden="true" />
                <span>Save Render</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Preview Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F3EE]">
        {isGeneratingMockup && viewportMode === 'ai-render' ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F4F3EE] px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E5E3DC] bg-[#FFFFFF]">
              <Loader2 className="h-6 w-6 animate-spin text-[#C84B31]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-[#141413]">
                Rendering photorealistic mockup with gemini-nano-banana-2.1
              </p>
              <p className="mt-1 text-sm text-[#5E5D59]">
                Integrating {logo?.name || 'uploaded logo'} onto {product.name} ({printFinish})
              </p>
            </div>
          </div>
        ) : viewportMode === 'ai-render' && !aiRenderUrl ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F4F3EE] px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E5E3DC] bg-[#FFFFFF]">
              <Layers className="h-5 w-5 text-[#141413]" aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <p className="font-display text-base font-semibold text-[#141413]">
                Ready to render AI product photography
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5E5D59]">
                Your live placement guide is configured for {product.name} in {garmentColorName}. Run AI placement to generate a studio shot with realistic fabric folds and {printFinish.toLowerCase()}.
              </p>
            </div>
            <button
              type="button"
              onClick={onGenerateMockup}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C84B31] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B23F27] whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Place Logo on {product.name}</span>
            </button>
          </div>
        ) : imgError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#EFECE5] px-6 text-center">
            <Layers className="h-8 w-8 text-[#71706B]" aria-hidden="true" />
            <p className="font-display text-sm font-semibold text-[#141413]">{product.name}</p>
            <p className="text-xs text-[#5E5D59]">{garmentColorName} · {product.material}</p>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <img
              src={activeCanvasImage}
              alt={`${product.name} studio mockup preview`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className={`h-full w-full ${
                viewportMode === 'proof' ? 'object-contain p-4 bg-[#FFFFFF]' : 'object-cover'
              }`}
            />

            {/* Interactive Live Placement Composite Layer */}
            {viewportMode === 'placement' && logo && (
              <div
                aria-label="Live logo print area"
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150"
                style={{
                  left: `${product.overlayBox.xPct}%`,
                  top: `${product.overlayBox.yPct}%`,
                  width: `${product.overlayBox.widthPct}%`,
                  height: `${product.overlayBox.heightPct}%`,
                }}
              >
                {showPrintGuides && (
                  <div className="absolute inset-0 border border-dashed border-[#C84B31]/80 bg-[#C84B31]/[0.03]">
                    <span className="absolute -top-5 left-0 font-mono text-[10px] font-medium text-[#C84B31] whitespace-nowrap">
                      {product.printWidthIn}&quot; × {product.printHeightIn}&quot; SAFE ZONE
                    </span>
                  </div>
                )}

                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    transform: `translate(${offsetXPct * 0.4}%, ${offsetYPct * 0.4}%) scale(${
                      scalePct / 100
                    })`,
                  }}
                >
                  <img
                    src={logo.dataUrl}
                    alt={logo.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
                    style={{
                      filter: getInkFilterStyle(inkTreatment),
                      mixBlendMode: inkTreatment === 'chalk' ? 'screen' : 'multiply',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unboxed Tabular Spec Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E3DC] px-5 py-3 text-xs text-[#5E5D59]">
        <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
          <span className="font-semibold text-[#141413]">{product.name}</span>
          <span aria-hidden="true">·</span>
          <span>{garmentColorName}</span>
          <span aria-hidden="true">·</span>
          <span>
            {product.printWidthIn}&quot; × {product.printHeightIn}&quot; @ {product.dpi} DPI
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {pxWidth} × {pxHeight} px
          </span>
        </div>

        <div className="text-xs text-[#5E5D59]">
          {aiRenderNote && viewportMode === 'ai-render' ? aiRenderNote : printFinish}
        </div>
      </div>
    </div>
  );
}
