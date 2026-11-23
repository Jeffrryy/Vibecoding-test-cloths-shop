import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertCircle, Loader2, Sparkles, Upload, Layers } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { StudioViewport, type ViewportMode } from './components/StudioViewport';
import { VariationsSection } from './components/VariationsSection';
import { PromptEditorSection } from './components/PromptEditorSection';
import { PrintExportSection } from './components/PrintExportSection';
import {
  DEFAULT_VARIATION_TEMPLATES,
  PRINT_FINISH_OPTIONS,
  PRODUCT_CATALOG,
  SAMPLE_LOGOS,
} from './data/studioCatalog';
import type {
  EditorHistoryItem,
  ImageResolution,
  InkTreatment,
  LogoAsset,
  PrintFinish,
  ProductId,
  SupportedAspectRatio,
  VariationSpec,
} from './types/merch';
import {
  exportPrintPackZip,
  normalizeLogoToPng,
  renderPressProofSheet,
  renderPrintReadyArtworkPng,
  svgStringToLogoAsset,
  triggerDownload,
  urlToBase64,
} from './utils/printExport';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function parseApiJson(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'AI mockup endpoints require the Node backend server (server.ts). Static hosts like GitHub Pages serve the interactive placement & 300 DPI print export UI unless VITE_API_BASE_URL is configured.'
    );
  }
  return res.json();
}

export default function App() {
  // Logo state
  const [logo, setLogo] = useState<LogoAsset | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  // Studio workbench state
  const [selectedProductId, setSelectedProductId] = useState<ProductId>('hoodie');
  const [garmentColorName, setGarmentColorName] = useState<string>('Heather Ash');
  const [printFinish, setPrintFinish] = useState<PrintFinish>('High-Density Puff Ink');
  const [inkTreatment, setInkTreatment] = useState<InkTreatment>('original');
  const [scalePct, setScalePct] = useState<number>(100);
  const [offsetXPct, setOffsetXPct] = useState<number>(0);
  const [offsetYPct, setOffsetYPct] = useState<number>(0);
  const [showPrintGuides, setShowPrintGuides] = useState<boolean>(true);
  const [mockupAspectRatio, setMockupAspectRatio] = useState<SupportedAspectRatio>('4:3');
  const [mockupImageSize, setMockupImageSize] = useState<ImageResolution>('2K');

  // Viewport & AI mockup state
  const [viewportMode, setViewportMode] = useState<ViewportMode>('placement');
  const [aiRenderUrl, setAiRenderUrl] = useState<string | null>(null);
  const [aiRenderNote, setAiRenderNote] = useState<string | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);

  // Press proof sheet preview state
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 5 Variations state
  const [variations, setVariations] = useState<VariationSpec[]>(DEFAULT_VARIATION_TEMPLATES);
  const [isPlanningVariations, setIsPlanningVariations] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [brandAnalysis, setBrandAnalysis] = useState<string | null>(null);

  // Prompt Editor state (gemini-nano-banana-2.1)
  const [editorPrompt, setEditorPrompt] = useState<string>(
    'Place the logo onto a warm minimalist editorial flatlay featuring heavyweight apparel, canvas tote, and ceramic cup in natural studio window light.'
  );
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('edit');
  const [editorSourceUrl, setEditorSourceUrl] = useState<string | null>(null);
  const [editorAspectRatio, setEditorAspectRatio] = useState<SupportedAspectRatio>('1:1');
  const [editorImageSize, setEditorImageSize] = useState<ImageResolution>('2K');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorHistory, setEditorHistory] = useState<EditorHistoryItem[]>([]);

  const selectedProduct = useMemo(
    () => PRODUCT_CATALOG.find((p) => p.id === selectedProductId) ?? PRODUCT_CATALOG[0],
    [selectedProductId]
  );

  const activePaletteHexes = useMemo(() => {
    const swatch = selectedProduct.colorSwatches.find((s) => s.name === garmentColorName);
    return [swatch?.hex || '#B9B9B6', '#141413', '#C84B31', '#F7F6F2'];
  }, [selectedProduct, garmentColorName]);

  // Load initial sample brand mark on mount so workspace starts populated
  useEffect(() => {
    let cancelled = false;
    const initDefaultLogo = async () => {
      try {
        const sample = SAMPLE_LOGOS[0];
        const asset = await svgStringToLogoAsset(sample.svg, sample.name, sample.id);
        if (!cancelled) {
          setLogo(asset);
          setEditorSourceUrl(asset.dataUrl);
        }
      } catch (err) {
        console.error('Failed to initialize sample logo:', err);
      }
    };
    initDefaultLogo();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep Press Proof Sheet preview updated when logo/product/transforms change
  useEffect(() => {
    if (!logo) {
      setProofPreviewUrl(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const url = await renderPressProofSheet({
          logoDataUrl: logo.dataUrl,
          product: selectedProduct,
          scalePct,
          offsetXPct,
          offsetYPct,
          inkTreatment,
          printFinish,
          garmentColorName,
          paletteHexes: activePaletteHexes,
        });
        if (!cancelled) setProofPreviewUrl(url);
      } catch (err) {
        console.error('Proof sheet render error:', err);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    logo,
    selectedProduct,
    scalePct,
    offsetXPct,
    offsetYPct,
    inkTreatment,
    printFinish,
    garmentColorName,
    activePaletteHexes,
  ]);

  const handleSelectProduct = (productId: ProductId) => {
    const next = PRODUCT_CATALOG.find((p) => p.id === productId);
    if (!next) return;
    setSelectedProductId(productId);
    setGarmentColorName(next.defaultColorName);
    setPrintFinish(next.defaultFinish);
    setAiRenderUrl(null);
    setViewportMode('placement');
  };

  const handleLogoFile = async (file: File) => {
    setStudioError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = String(reader.result);
        const cleanName = file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Logo';
        const asset = await normalizeLogoToPng(result, cleanName, `upload-${Date.now()}`);
        setLogo(asset);
        setEditorSourceUrl(asset.dataUrl);
        setAiRenderUrl(null);
        setVariations((prev) =>
          prev.map((v) => ({ ...v, status: 'idle', generatedImageUrl: undefined, errorMessage: undefined }))
        );
      } catch (err) {
        setStudioError(err instanceof Error ? err.message : 'Unable to process uploaded logo file.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleDropLogo = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleSelectSampleLogo = async (sampleId: string) => {
    const sample = SAMPLE_LOGOS.find((s) => s.id === sampleId);
    if (!sample) return;
    setStudioError(null);
    try {
      const asset = await svgStringToLogoAsset(sample.svg, sample.name, sample.id);
      setLogo(asset);
      setEditorSourceUrl(asset.dataUrl);
      setAiRenderUrl(null);
      setVariations((prev) =>
        prev.map((v) => ({ ...v, status: 'idle', generatedImageUrl: undefined, errorMessage: undefined }))
      );
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : 'Failed to load sample mark.');
    }
  };

  // Single AI product mockup generation using gemini-nano-banana-2.1
  const handleGenerateSingleMockup = async () => {
    if (!logo) {
      setStudioError('Please upload or select a logo first.');
      return;
    }

    setStudioError(null);
    setIsGeneratingMockup(true);
    setViewportMode('ai-render');

    try {
      const blankData = await urlToBase64(selectedProduct.blankImageUrl);
      const placementDesc = `Placed at ${scalePct}% scale with horizontal offset ${offsetXPct}% and vertical offset ${offsetYPct}%. Ink treatment: ${inkTreatment}.`;

      const res = await fetch(`${API_BASE}/api/mockups/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoBase64: logo.dataUrl,
          logoMimeType: logo.mimeType,
          productBlankBase64: blankData.base64,
          productBlankMimeType: blankData.mimeType,
          productName: selectedProduct.name,
          garmentColor: garmentColorName,
          printStyle: printFinish,
          arrangement: placementDesc,
          paletteDescription: `Garment in ${garmentColorName} with ${inkTreatment} ink treatment`,
          aspectRatio: mockupAspectRatio,
          imageSize: mockupImageSize,
        }),
      });

      const data = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Mockup generation failed.');
      }

      setAiRenderUrl(data.imageUrl);
      setAiRenderNote(data.text || `${printFinish} · ${mockupImageSize}`);
      setEditorSourceUrl(data.imageUrl);
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : 'Failed to generate mockup.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  // Helper to render one variation via gemini-nano-banana-2.1
  const renderSingleVariation = useCallback(
    async (variation: VariationSpec, currentLogo: LogoAsset) => {
      const prod = PRODUCT_CATALOG.find((p) => p.id === variation.productId) ?? PRODUCT_CATALOG[0];

      setVariations((prev) =>
        prev.map((v) =>
          v.id === variation.id ? { ...v, status: 'generating', errorMessage: undefined } : v
        )
      );

      try {
        const blankData = await urlToBase64(prod.blankImageUrl);
        const res = await fetch(`${API_BASE}/api/mockups/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logoBase64: currentLogo.dataUrl,
            logoMimeType: currentLogo.mimeType,
            productBlankBase64: blankData.base64,
            productBlankMimeType: blankData.mimeType,
            productName: prod.name,
            garmentColor: variation.garmentColorName,
            printStyle: variation.printStyle,
            arrangement: variation.arrangement,
            paletteDescription: `${variation.paletteName} (${variation.paletteHexes.join(', ')})`,
            customInstructions: variation.artDirectionPrompt,
            aspectRatio: '4:3',
            imageSize: '1K',
          }),
        });

        const data = await parseApiJson(res);
        if (!res.ok) {
          throw new Error(data.error || 'Variation rendering failed.');
        }

        setVariations((prev) =>
          prev.map((v) =>
            v.id === variation.id
              ? { ...v, status: 'ready', generatedImageUrl: data.imageUrl, errorMessage: undefined }
              : v
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Variation failed.';
        setVariations((prev) =>
          prev.map((v) =>
            v.id === variation.id ? { ...v, status: 'error', errorMessage: message } : v
          )
        );
        throw err;
      }
    },
    []
  );

  // Plan & generate 5 diverse variations for the uploaded logo
  const handleGenerateAllVariations = async () => {
    if (!logo) {
      setStudioError('Upload or select a logo before generating variations.');
      return;
    }

    setStudioError(null);
    setIsPlanningVariations(true);
    let plannedList: VariationSpec[] = variations;

    try {
      const planRes = await fetch(`${API_BASE}/api/mockups/plan-variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoBase64: logo.dataUrl,
          logoMimeType: logo.mimeType,
          defaultProduct: selectedProductId,
        }),
      });

      const planData = await parseApiJson(planRes);
      if (planRes.ok && Array.isArray(planData.variations) && planData.variations.length === 5) {
        const treatments: InkTreatment[] = ['charcoal', 'chalk', 'vermilion', 'halftone', 'original'];
        plannedList = planData.variations.map((item: Partial<VariationSpec>, idx: number) => {
          const fallback = DEFAULT_VARIATION_TEMPLATES[idx];
          const validProductId: ProductId =
            item.productId === 'hoodie' ||
            item.productId === 'tee' ||
            item.productId === 'tote' ||
            item.productId === 'mug'
              ? item.productId
              : fallback.productId;
          const prod = PRODUCT_CATALOG.find((p) => p.id === validProductId) ?? PRODUCT_CATALOG[0];

          return {
            id: item.id || fallback.id,
            indexLabel: `0${idx + 1}.`,
            title: item.title || fallback.title,
            productId: validProductId,
            productLabel: item.productLabel || prod.name,
            arrangement: item.arrangement || fallback.arrangement,
            printStyle: item.printStyle || fallback.printStyle,
            paletteName: item.paletteName || fallback.paletteName,
            garmentColorName: item.garmentColorName || fallback.garmentColorName,
            paletteHexes:
              Array.isArray(item.paletteHexes) && item.paletteHexes.length >= 2
                ? item.paletteHexes
                : fallback.paletteHexes,
            artDirectionPrompt: item.artDirectionPrompt || fallback.artDirectionPrompt,
            inkTreatment: treatments[idx] ?? 'original',
            scalePct: fallback.scalePct,
            offsetXPct: fallback.offsetXPct,
            offsetYPct: fallback.offsetYPct,
            status: 'idle',
          };
        });

        setVariations(plannedList);
        if (planData.brandAnalysis) {
          setBrandAnalysis(planData.brandAnalysis);
        }
      } else if (!planRes.ok) {
        setStudioError(planData.error || 'Could not analyze logo; using default studio variation blueprints.');
      }
    } catch (err) {
      setStudioError(
        err instanceof Error ? err.message : 'Logo planning failed; running studio variation blueprints.'
      );
    } finally {
      setIsPlanningVariations(false);
    }

    // Generate all 5 variations via gemini-nano-banana-2.1 (2 concurrent workers to stay smooth & responsive)
    setIsGeneratingBatch(true);
    try {
      const queue = [...plannedList];
      const workerCount = 2;
      const runWorker = async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;
          try {
            await renderSingleVariation(next, logo);
          } catch {
            // Individual card displays its own error state
          }
        }
      };
      await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleRegenerateSingleVariation = async (variationId: string) => {
    if (!logo) return;
    const target = variations.find((v) => v.id === variationId);
    if (!target) return;
    try {
      await renderSingleVariation(target, logo);
    } catch {
      // Error is stored on the variation card
    }
  };

  const handleInspectVariation = (variation: VariationSpec) => {
    const prod = PRODUCT_CATALOG.find((p) => p.id === variation.productId) ?? PRODUCT_CATALOG[0];
    setSelectedProductId(prod.id);
    setGarmentColorName(variation.garmentColorName);
    setPrintFinish(
      (PRINT_FINISH_OPTIONS.find((f) => f === variation.printStyle) as PrintFinish) ??
        prod.defaultFinish
    );
    setInkTreatment(variation.inkTreatment);
    setScalePct(variation.scalePct);
    setOffsetXPct(variation.offsetXPct);
    setOffsetYPct(variation.offsetYPct);
    if (variation.generatedImageUrl) {
      setAiRenderUrl(variation.generatedImageUrl);
      setAiRenderNote(`${variation.title} · ${variation.printStyle}`);
      setViewportMode('ai-render');
    } else {
      setAiRenderUrl(null);
      setViewportMode('placement');
    }
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Prompt-driven Image Creation & Editing (gemini-nano-banana-2.1)
  const handleRunPromptEditor = async () => {
    if (!editorPrompt.trim()) return;
    setEditorError(null);
    setIsEditingImage(true);

    try {
      let sourceBase64: string | undefined;
      let sourceMime: string | undefined;

      if (editorMode === 'edit' && editorSourceUrl) {
        if (editorSourceUrl.startsWith('data:')) {
          sourceBase64 = editorSourceUrl;
        } else {
          const converted = await urlToBase64(editorSourceUrl);
          sourceBase64 = converted.base64;
          sourceMime = converted.mimeType;
        }
      }

      const res = await fetch(`${API_BASE}/api/images/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editorPrompt.trim(),
          sourceImageBase64: sourceBase64,
          sourceMimeType: sourceMime,
          aspectRatio: editorAspectRatio,
          imageSize: editorImageSize,
        }),
      });

      const data = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Image generation failed.');
      }

      const item: EditorHistoryItem = {
        id: `${Date.now()}`,
        prompt: editorPrompt.trim(),
        mode: editorMode,
        aspectRatio: editorAspectRatio,
        imageSize: editorImageSize,
        imageUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
      };

      setEditorHistory((prev) => [item, ...prev]);
      setEditorSourceUrl(data.imageUrl);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to run image edit.');
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleSendToPromptEditor = (imageUrl: string, promptHint?: string) => {
    setEditorSourceUrl(imageUrl);
    setEditorMode('edit');
    if (promptHint) {
      setEditorPrompt(promptHint);
    }
    document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePromoteEditorResultToLogo = async (imageUrl: string) => {
    try {
      const asset = await normalizeLogoToPng(imageUrl, 'Studio Edited Artwork', `edited-${Date.now()}`);
      setLogo(asset);
      setViewportMode('placement');
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to apply image as studio logo.');
    }
  };

  // Print-ready Export handlers
  const handleDownloadPrintPng = async (override?: {
    product: typeof selectedProduct;
    scalePct: number;
    offsetXPct: number;
    offsetYPct: number;
    inkTreatment: InkTreatment;
  }) => {
    if (!logo) return;
    setIsExporting(true);
    try {
      const target = override ?? {
        product: selectedProduct,
        scalePct,
        offsetXPct,
        offsetYPct,
        inkTreatment,
      };
      const result = await renderPrintReadyArtworkPng({
        logoDataUrl: logo.dataUrl,
        product: target.product,
        scalePct: target.scalePct,
        offsetXPct: target.offsetXPct,
        offsetYPct: target.offsetYPct,
        inkTreatment: target.inkTreatment,
      });
      triggerDownload(result.dataUrl, `${target.product.id}-print-300dpi.png`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadProofSheet = async () => {
    if (!logo) return;
    setIsExporting(true);
    try {
      const proofUrl = await renderPressProofSheet({
        logoDataUrl: logo.dataUrl,
        product: selectedProduct,
        scalePct,
        offsetXPct,
        offsetYPct,
        inkTreatment,
        printFinish,
        garmentColorName,
        paletteHexes: activePaletteHexes,
      });
      triggerDownload(proofUrl, `${selectedProduct.id}-press-proof-sheet.png`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadZipPack = async () => {
    if (!logo) return;
    setIsExporting(true);
    try {
      await exportPrintPackZip({
        logo,
        product: selectedProduct,
        scalePct,
        offsetXPct,
        offsetYPct,
        inkTreatment,
        printFinish,
        garmentColorName,
        paletteHexes: activePaletteHexes,
        activeMockupUrl: aiRenderUrl,
        variations,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#141413]">
      <TopBar onExportPack={handleDownloadZipPack} isExporting={isExporting} />

      <main>
        {/* Section 1: Studio Workbench */}
        <section id="studio" className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-[#C84B31]">01. Mockup &amp; Pre-Press Workbench</p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-[#141413] sm:text-4xl text-balance">
              On-demand merch mockups &amp; print-ready production
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#5E5D59] max-w-2xl">
              Upload your brand mark to place it onto studio merchandise photography with{' '}
              <span className="font-mono text-xs text-[#141413]">gemini-nano-banana-2.1</span>, explore 5 distinct style variations, refine via text prompts, and export 300 DPI print packs.
            </p>
          </div>

          {studioError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-[#C84B31]/40 bg-[#FFFFFF] px-4 py-3 text-sm text-[#9E351F]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C84B31]" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium text-[#141413]">Studio notice</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#5E5D59]">{studioError}</p>
              </div>
              <button
                type="button"
                onClick={() => setStudioError(null)}
                className="text-xs font-medium text-[#5E5D59] hover:text-[#141413]"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Left Configuration Column */}
            <aside className="lg:col-span-4 space-y-6 rounded-xl border border-[#E5E3DC] bg-[#FFFFFF] p-6">
              {/* Logo Upload */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-[#141413]">Brand Logo Mark</span>
                  {logo && (
                    <span className="font-mono text-[11px] text-[#71706B] tabular-nums">
                      {logo.width} × {logo.height} px
                    </span>
                  )}
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleDropLogo}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed p-3.5 transition-colors ${
                    isDraggingLogo
                      ? 'border-[#C84B31] bg-[#C84B31]/5'
                      : 'border-[#D6D4CC] bg-[#F7F6F2]/70 hover:border-[#141413]/40'
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E3DC] bg-[#FFFFFF] p-1.5 studio-checkerboard">
                    {logo ? (
                      <img
                        src={logo.dataUrl}
                        alt={logo.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Upload className="h-4 w-4 text-[#71706B]" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#141413]">
                      {logo ? logo.name : 'Upload PNG, SVG, or JPG logo'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#5E5D59]">
                      Drop file here or click to replace
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileInputChange}
                    className="sr-only"
                  />
                </label>

                {/* Instant Sample Marks */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-[#71706B] shrink-0">Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_LOGOS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSampleLogo(sample.id)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                          logo?.id === sample.id
                            ? 'border-[#141413] bg-[#141413] text-white'
                            : 'border-[#E5E3DC] bg-[#FFFFFF] text-[#5E5D59] hover:text-[#141413]'
                        }`}
                      >
                        {sample.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-[#EAE8E0]" />

              {/* Product Selector */}
              <div>
                <span className="block text-xs font-semibold text-[#141413] mb-2.5">
                  Product Blank
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {PRODUCT_CATALOG.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod.id)}
                      className={`flex flex-col overflow-hidden rounded-lg border text-left transition-colors ${
                        selectedProductId === prod.id
                          ? 'border-[#C84B31] ring-1 ring-[#C84B31]/20 bg-[#FFFFFF]'
                          : 'border-[#E5E3DC] bg-[#F7F6F2]/50 hover:border-[#141413]/30'
                      }`}
                    >
                      <img
                        src={prod.blankImageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="px-2.5 py-2">
                        <p className="truncate text-xs font-semibold text-[#141413]">{prod.name}</p>
                        <p className="truncate text-[11px] text-[#5E5D59] font-mono tabular-nums">
                          {prod.printWidthIn}&quot;×{prod.printHeightIn}&quot;
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colorway & Print Finish */}
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-[#141413] mb-2">
                    Substrate Colorway — <span className="font-normal text-[#5E5D59]">{garmentColorName}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colorSwatches.map((swatch) => (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => setGarmentColorName(swatch.name)}
                        title={swatch.name}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                          garmentColorName === swatch.name
                            ? 'border-[#141413] bg-[#F7F6F2] font-medium text-[#141413]'
                            : 'border-[#E5E3DC] bg-[#FFFFFF] text-[#5E5D59] hover:border-[#141413]/30'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-xs border border-black/15"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="whitespace-nowrap">{swatch.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="print-finish-select"
                    className="block text-xs font-semibold text-[#141413] mb-1.5"
                  >
                    Print Technique
                  </label>
                  <select
                    id="print-finish-select"
                    value={printFinish}
                    onChange={(e) => setPrintFinish(e.target.value as PrintFinish)}
                    className="w-full rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3 py-2 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
                  >
                    {PRINT_FINISH_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ink Treatment */}
                <div>
                  <span className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Ink Color Treatment
                  </span>
                  <div className="grid grid-cols-5 gap-1 rounded-lg bg-[#F4F3EE] p-1">
                    {(
                      [
                        ['original', 'Orig'],
                        ['charcoal', 'Ink'],
                        ['chalk', 'Chalk'],
                        ['vermilion', 'Red'],
                        ['halftone', 'Tone'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInkTreatment(key)}
                        className={`rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                          inkTreatment === key
                            ? 'bg-[#FFFFFF] text-[#141413] shadow-xs'
                            : 'text-[#5E5D59] hover:text-[#141413]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scale & Offset Sliders */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="scale-slider" className="font-medium text-[#5E5D59]">
                        Artwork Scale
                      </label>
                      <span className="font-mono text-[#141413] tabular-nums">{scalePct}%</span>
                    </div>
                    <input
                      id="scale-slider"
                      type="range"
                      min={40}
                      max={140}
                      value={scalePct}
                      onChange={(e) => setScalePct(Number(e.target.value))}
                      className="w-full accent-[#C84B31]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label htmlFor="x-slider" className="font-medium text-[#5E5D59]">
                          X Offset
                        </label>
                        <span className="font-mono text-[#141413] tabular-nums">{offsetXPct}%</span>
                      </div>
                      <input
                        id="x-slider"
                        type="range"
                        min={-35}
                        max={35}
                        value={offsetXPct}
                        onChange={(e) => setOffsetXPct(Number(e.target.value))}
                        className="w-full accent-[#141413]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label htmlFor="y-slider" className="font-medium text-[#5E5D59]">
                          Y Offset
                        </label>
                        <span className="font-mono text-[#141413] tabular-nums">{offsetYPct}%</span>
                      </div>
                      <input
                        id="y-slider"
                        type="range"
                        min={-35}
                        max={35}
                        value={offsetYPct}
                        onChange={(e) => setOffsetYPct(Number(e.target.value))}
                        className="w-full accent-[#141413]"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Render Settings */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label
                      htmlFor="mockup-aspect"
                      className="block text-[11px] font-medium text-[#5E5D59] mb-1"
                    >
                      Shot Aspect
                    </label>
                    <select
                      id="mockup-aspect"
                      value={mockupAspectRatio}
                      onChange={(e) => setMockupAspectRatio(e.target.value as SupportedAspectRatio)}
                      className="w-full rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-mono text-[#141413]"
                    >
                      <option value="4:3">4:3</option>
                      <option value="1:1">1:1</option>
                      <option value="3:4">3:4</option>
                      <option value="16:9">16:9</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="mockup-res"
                      className="block text-[11px] font-medium text-[#5E5D59] mb-1"
                    >
                      Render Quality
                    </label>
                    <select
                      id="mockup-res"
                      value={mockupImageSize}
                      onChange={(e) => setMockupImageSize(e.target.value as ImageResolution)}
                      className="w-full rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-mono text-[#141413]"
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Studio Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateSingleMockup}
                  disabled={!logo || isGeneratingMockup}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#141413] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2B2B29] disabled:opacity-50 whitespace-nowrap"
                >
                  {isGeneratingMockup ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {isGeneratingMockup ? 'Placing Logo with AI...' : 'Place Logo on Mockup'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('variations')?.scrollIntoView({ behavior: 'smooth' });
                    handleGenerateAllVariations();
                  }}
                  disabled={!logo || isPlanningVariations || isGeneratingBatch}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C84B31] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B23F27] disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Generate 5 Style Variations</span>
                </button>
              </div>
            </aside>

            {/* Right Studio Stage */}
            <div className="lg:col-span-8 space-y-4">
              <StudioViewport
                logo={logo}
                product={selectedProduct}
                garmentColorName={garmentColorName}
                printFinish={printFinish}
                inkTreatment={inkTreatment}
                scalePct={scalePct}
                offsetXPct={offsetXPct}
                offsetYPct={offsetYPct}
                showPrintGuides={showPrintGuides}
                onToggleGuides={() => setShowPrintGuides((s) => !s)}
                viewportMode={viewportMode}
                onChangeMode={setViewportMode}
                aiRenderUrl={aiRenderUrl}
                aiRenderNote={aiRenderNote}
                isGeneratingMockup={isGeneratingMockup}
                proofPreviewUrl={proofPreviewUrl}
                onGenerateMockup={handleGenerateSingleMockup}
                onSendToEditor={(url) => handleSendToPromptEditor(url)}
                onDownloadActiveRender={() => {
                  if (aiRenderUrl) {
                    triggerDownload(aiRenderUrl, `${selectedProduct.id}-ai-mockup.png`);
                  }
                }}
              />

              {brandAnalysis && (
                <div className="rounded-xl border border-[#E5E3DC] bg-[#FFFFFF] px-5 py-3.5 text-xs text-[#5E5D59]">
                  <span className="font-semibold text-[#141413]">Logo Direction Note: </span>
                  {brandAnalysis}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: 5 Diverse Design Variations */}
        <VariationsSection
          logo={logo}
          variations={variations}
          products={PRODUCT_CATALOG}
          isPlanning={isPlanningVariations}
          isGeneratingBatch={isGeneratingBatch}
          onGenerateAllVariations={handleGenerateAllVariations}
          onRegenerateSingle={handleRegenerateSingleVariation}
          onInspectVariation={handleInspectVariation}
          onEditVariationInPromptStudio={handleSendToPromptEditor}
          onExportVariationPrintFile={(v) => {
            const prod = PRODUCT_CATALOG.find((p) => p.id === v.productId) ?? PRODUCT_CATALOG[0];
            handleDownloadPrintPng({
              product: prod,
              scalePct: v.scalePct,
              offsetXPct: v.offsetXPct,
              offsetYPct: v.offsetYPct,
              inkTreatment: v.inkTreatment,
            });
          }}
        />

        {/* Section 3: Create & Edit Images with gemini-nano-banana-2.1 */}
        <PromptEditorSection
          logo={logo}
          activeMockupUrl={aiRenderUrl}
          prompt={editorPrompt}
          onChangePrompt={setEditorPrompt}
          sourceImageUrl={editorSourceUrl}
          onChangeSourceImage={setEditorSourceUrl}
          mode={editorMode}
          onChangeMode={setEditorMode}
          aspectRatio={editorAspectRatio}
          onChangeAspectRatio={setEditorAspectRatio}
          imageSize={editorImageSize}
          onChangeImageSize={setEditorImageSize}
          isProcessing={isEditingImage}
          errorMessage={editorError}
          history={editorHistory}
          onRunPrompt={handleRunPromptEditor}
          onPromoteToLogo={handlePromoteEditorResultToLogo}
        />

        {/* Section 4: Print-Ready Production & Export */}
        <PrintExportSection
          logo={logo}
          product={selectedProduct}
          garmentColorName={garmentColorName}
          printFinish={printFinish}
          inkTreatment={inkTreatment}
          scalePct={scalePct}
          offsetXPct={offsetXPct}
          offsetYPct={offsetYPct}
          proofPreviewUrl={proofPreviewUrl}
          isExporting={isExporting}
          onDownloadPrintPng={() => handleDownloadPrintPng()}
          onDownloadProofSheet={handleDownloadProofSheet}
          onDownloadZipPack={handleDownloadZipPack}
        />
      </main>

      <footer className="border-t border-[#E5E3DC] bg-[#F7F6F2] py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-6 text-xs text-[#5E5D59] sm:flex-row sm:items-center lg:px-10">
          <p className="font-medium text-[#141413]">Presshouse Studio</p>
          <p>
            300 DPI pre-press export · AI product mockups &amp; prompt editing powered by{' '}
            <span className="font-mono text-[#141413]">gemini-nano-banana-2.1</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
