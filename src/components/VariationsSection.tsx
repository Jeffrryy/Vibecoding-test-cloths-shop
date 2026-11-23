import { Download, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import type { LogoAsset, ProductSpec, VariationSpec } from '../types/merch';

interface VariationsSectionProps {
  logo: LogoAsset | null;
  variations: VariationSpec[];
  products: ProductSpec[];
  isPlanning: boolean;
  isGeneratingBatch: boolean;
  onGenerateAllVariations: () => void;
  onRegenerateSingle: (variationId: string) => void;
  onInspectVariation: (variation: VariationSpec) => void;
  onEditVariationInPromptStudio: (imageUrl: string, promptHint: string) => void;
  onExportVariationPrintFile: (variation: VariationSpec) => void;
}

export function VariationsSection({
  logo,
  variations,
  products,
  isPlanning,
  isGeneratingBatch,
  onGenerateAllVariations,
  onRegenerateSingle,
  onInspectVariation,
  onEditVariationInPromptStudio,
  onExportVariationPrintFile,
}: VariationsSectionProps) {
  const readyCount = variations.filter((v) => v.status === 'ready').length;

  return (
    <section id="variations" className="border-t border-[#E5E3DC] bg-[#FFFFFF] py-16">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#C84B31]">02. Multi-Style Exploration</p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#141413] sm:text-3xl text-balance">
              Five diverse mockup variations tailored to your logo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5E5D59]">
              Each variation explores a distinct placement arrangement, garment colorway, ink palette, and physical print method using <span className="font-mono text-xs text-[#141413]">gemini-nano-banana-2.1</span>.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {readyCount > 0 && (
              <span className="font-mono text-xs text-[#5E5D59] tabular-nums">
                {readyCount} of 5 rendered
              </span>
            )}
            <button
              type="button"
              onClick={onGenerateAllVariations}
              disabled={!logo || isPlanning || isGeneratingBatch}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C84B31] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B23F27] disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C84B31]"
            >
              {isPlanning || isGeneratingBatch ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {isPlanning
                  ? 'Analyzing Logo...'
                  : isGeneratingBatch
                  ? 'Generating 5 Variations...'
                  : 'Generate 5 AI Variations'}
              </span>
            </button>
          </div>
        </div>

        {/* 5-Variation Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {variations.map((variation) => {
            const product = products.find((p) => p.id === variation.productId) ?? products[0];
            const displayImage = variation.generatedImageUrl || product.blankImageUrl;
            const isCompositeFallback = !variation.generatedImageUrl;

            return (
              <article
                key={variation.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[#E5E3DC] bg-[#F7F6F2]/50 transition-shadow hover:shadow-sm"
              >
                {/* Visual Frame */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE5]">
                  {variation.status === 'generating' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#F4F3EE] px-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#C84B31]" aria-hidden="true" />
                      <div>
                        <p className="font-display text-xs font-semibold text-[#141413]">
                          Rendering {variation.indexLabel} {variation.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[#5E5D59]">{variation.printStyle}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={displayImage}
                        alt={`${variation.title} on ${variation.productLabel}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />

                      {/* Live Logo Composite Preview before AI generation */}
                      {isCompositeFallback && logo && (
                        <div
                          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${product.overlayBox.xPct}%`,
                            top: `${product.overlayBox.yPct}%`,
                            width: `${product.overlayBox.widthPct}%`,
                            height: `${product.overlayBox.heightPct}%`,
                          }}
                        >
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              transform: `translate(${variation.offsetXPct * 0.4}%, ${
                                variation.offsetYPct * 0.4
                              }%) scale(${variation.scalePct / 100})`,
                            }}
                          >
                            <img
                              src={logo.dataUrl}
                              alt={logo.name}
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain"
                              style={{
                                filter:
                                  variation.inkTreatment === 'charcoal'
                                    ? 'brightness(0) opacity(0.9)'
                                    : variation.inkTreatment === 'chalk'
                                    ? 'brightness(0) invert(1) opacity(0.95)'
                                    : variation.inkTreatment === 'vermilion'
                                    ? 'sepia(100%) saturate(450%) hue-rotate(-14deg) brightness(0.88)'
                                    : variation.inkTreatment === 'halftone'
                                    ? 'grayscale(100%) contrast(130%) opacity(0.84)'
                                    : 'none',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5 bg-[#FFFFFF]">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold text-[#141413]">
                        {variation.indexLabel} {variation.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0" aria-label="Color palette swatches">
                        {variation.paletteHexes.slice(0, 3).map((hex, i) => (
                          <span
                            key={`${variation.id}-hex-${i}`}
                            title={hex}
                            className="h-3.5 w-3.5 rounded-xs border border-[#D6D4CC]"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Zero-pill typographic metadata */}
                    <p className="mt-1.5 text-xs text-[#5E5D59]">
                      {variation.productLabel} · {variation.printStyle}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#5E5D59]">
                      {variation.arrangement} — {variation.paletteName} ({variation.garmentColorName})
                    </p>

                    {variation.status === 'error' && variation.errorMessage && (
                      <p className="mt-2.5 rounded-md border border-[#C84B31]/30 bg-[#C84B31]/5 px-2.5 py-1.5 text-xs text-[#9E351F]">
                        {variation.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAE8E0] pt-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onInspectVariation(variation)}
                        className="text-xs font-semibold text-[#141413] hover:text-[#C84B31] transition-colors whitespace-nowrap"
                      >
                        Load in Studio
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onEditVariationInPromptStudio(
                            displayImage,
                            variation.artDirectionPrompt
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#5E5D59] hover:text-[#141413] transition-colors whitespace-nowrap"
                      >
                        <Wand2 className="h-3 w-3" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRegenerateSingle(variation.id)}
                        disabled={variation.status === 'generating' || !logo}
                        title="Generate or regenerate this AI variation"
                        className="inline-flex items-center gap-1 rounded-md border border-[#E5E3DC] px-2.5 py-1 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] disabled:opacity-50 whitespace-nowrap"
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        <span>{variation.generatedImageUrl ? 'Redo' : 'Render'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportVariationPrintFile(variation)}
                        title="Download 300 DPI Print File"
                        className="inline-flex items-center gap-1 rounded-md border border-[#E5E3DC] px-2.5 py-1 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] whitespace-nowrap"
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        <span>300 DPI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
