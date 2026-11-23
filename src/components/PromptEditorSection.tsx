import { useState, type ChangeEvent } from 'react';
import { Download, ImagePlus, Layers, Loader2, Sparkles, Upload } from 'lucide-react';
import type {
  EditorHistoryItem,
  ImageResolution,
  LogoAsset,
  SupportedAspectRatio,
} from '../types/merch';
import { triggerDownload } from '../utils/printExport';

interface PromptEditorSectionProps {
  logo: LogoAsset | null;
  activeMockupUrl: string | null;
  prompt: string;
  onChangePrompt: (value: string) => void;
  sourceImageUrl: string | null;
  onChangeSourceImage: (url: string | null) => void;
  mode: 'create' | 'edit';
  onChangeMode: (mode: 'create' | 'edit') => void;
  aspectRatio: SupportedAspectRatio;
  onChangeAspectRatio: (ratio: SupportedAspectRatio) => void;
  imageSize: ImageResolution;
  onChangeImageSize: (size: ImageResolution) => void;
  isProcessing: boolean;
  errorMessage: string | null;
  history: EditorHistoryItem[];
  onRunPrompt: () => void;
  onPromoteToLogo: (imageUrl: string) => void;
}

const PROMPT_PRESETS = [
  'Restyle the merchandise shot in warm golden-hour architectural sunlight on raw travertine stone with crisp fabric grain.',
  'Convert the logo artwork into a textured chainstitch chenille varsity patch sewn onto heavyweight forest-green wool.',
  'Create a minimalist studio flatlay of matching tote bag, stoneware mug, and crewneck tee featuring the brand aesthetic.',
  'Add subtle vintage screenprint distressing and place the garment on a clean brushed-concrete editorial lookbook backdrop.',
];

const ASPECT_RATIOS: SupportedAspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16', '4:1', '1:4'];
const RESOLUTIONS: ImageResolution[] = ['1K', '2K', '4K'];

export function PromptEditorSection({
  logo,
  activeMockupUrl,
  prompt,
  onChangePrompt,
  sourceImageUrl,
  onChangeSourceImage,
  mode,
  onChangeMode,
  aspectRatio,
  onChangeAspectRatio,
  imageSize,
  onChangeImageSize,
  isProcessing,
  errorMessage,
  history,
  onRunPrompt,
  onPromoteToLogo,
}: PromptEditorSectionProps) {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const activeResult =
    history.find((item) => item.id === selectedHistoryId) ?? history[0] ?? null;

  const handleUploadSource = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeSourceImage(reader.result);
        onChangeMode('edit');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section id="editor" className="border-t border-[#E5E3DC] bg-[#F7F6F2] py-16">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#C84B31]">03. Creative Prompt Studio</p>
          <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#141413] sm:text-3xl text-balance">
            Create &amp; edit images with text prompts
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5E5D59]">
            Direct <span className="font-mono text-xs text-[#141413]">gemini-nano-banana-2.1</span> to generate brand graphics from scratch or refine any uploaded logo, mockup, or variation up to 4K resolution.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#E5E3DC] bg-[#FFFFFF] p-6">
            <div className="space-y-6">
              {/* Mode Switch */}
              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-2">
                  Generation Mode
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#F4F3EE] p-1">
                  <button
                    type="button"
                    onClick={() => onChangeMode('edit')}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      mode === 'edit'
                        ? 'bg-[#FFFFFF] text-[#141413] shadow-xs'
                        : 'text-[#5E5D59] hover:text-[#141413]'
                    }`}
                  >
                    Edit Reference Image
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMode('create')}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      mode === 'create'
                        ? 'bg-[#FFFFFF] text-[#141413] shadow-xs'
                        : 'text-[#5E5D59] hover:text-[#141413]'
                    }`}
                  >
                    Create From Prompt
                  </button>
                </div>
              </div>

              {/* Reference Source Selector (when editing) */}
              {mode === 'edit' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#141413]">Source Image</span>
                    <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#C84B31] hover:underline">
                      <Upload className="h-3 w-3" aria-hidden="true" />
                      <span>Upload Custom</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadSource}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {logo && (
                      <button
                        type="button"
                        onClick={() => onChangeSourceImage(logo.dataUrl)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs transition-colors ${
                          sourceImageUrl === logo.dataUrl
                            ? 'border-[#C84B31] bg-[#C84B31]/5 text-[#141413]'
                            : 'border-[#E5E3DC] bg-[#F7F6F2] text-[#5E5D59] hover:border-[#141413]/30'
                        }`}
                      >
                        <img
                          src={logo.dataUrl}
                          alt="Uploaded logo source"
                          referrerPolicy="no-referrer"
                          className="h-12 w-full object-contain"
                        />
                        <span className="truncate w-full text-center text-[11px] font-medium">
                          Brand Logo
                        </span>
                      </button>
                    )}

                    {activeMockupUrl && (
                      <button
                        type="button"
                        onClick={() => onChangeSourceImage(activeMockupUrl)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs transition-colors ${
                          sourceImageUrl === activeMockupUrl
                            ? 'border-[#C84B31] bg-[#C84B31]/5 text-[#141413]'
                            : 'border-[#E5E3DC] bg-[#F7F6F2] text-[#5E5D59] hover:border-[#141413]/30'
                        }`}
                      >
                        <img
                          src={activeMockupUrl}
                          alt="Active mockup source"
                          referrerPolicy="no-referrer"
                          className="h-12 w-full rounded object-cover"
                        />
                        <span className="truncate w-full text-center text-[11px] font-medium">
                          Current Mockup
                        </span>
                      </button>
                    )}

                    {sourceImageUrl &&
                      sourceImageUrl !== logo?.dataUrl &&
                      sourceImageUrl !== activeMockupUrl && (
                        <button
                          type="button"
                          onClick={() => onChangeSourceImage(sourceImageUrl)}
                          className="flex flex-col items-center gap-1.5 rounded-lg border border-[#C84B31] bg-[#C84B31]/5 p-2 text-xs text-[#141413]"
                        >
                          <img
                            src={sourceImageUrl}
                            alt="Selected custom source"
                            referrerPolicy="no-referrer"
                            className="h-12 w-full rounded object-cover"
                          />
                          <span className="truncate w-full text-center text-[11px] font-medium">
                            Selected Input
                          </span>
                        </button>
                      )}
                  </div>
                </div>
              )}

              {/* Prompt Textarea */}
              <div>
                <label
                  htmlFor="nano-banana-prompt"
                  className="block text-xs font-semibold text-[#141413] mb-2"
                >
                  Art Direction Prompt
                </label>
                <textarea
                  id="nano-banana-prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => onChangePrompt(e.target.value)}
                  placeholder={
                    mode === 'edit'
                      ? 'Describe how to restyle, recolor, or transform the selected image...'
                      : 'Describe a new logo mark, graphic badge, or merch studio scene to create...'
                  }
                  className="w-full rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#8A8882] focus:border-[#141413] focus:outline-none"
                />
                <div className="mt-2.5 space-y-1.5">
                  <span className="block text-[11px] font-medium text-[#71706B]">
                    Quick Studio Prompts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onChangePrompt(preset)}
                        className="rounded-md border border-[#E5E3DC] bg-[#F7F6F2] px-2.5 py-1 text-left text-[11px] text-[#5E5D59] hover:border-[#141413]/30 hover:text-[#141413] transition-colors"
                      >
                        Preset 0{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resolution & Aspect Ratio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="editor-aspect-ratio"
                    className="block text-xs font-semibold text-[#141413] mb-1.5"
                  >
                    Aspect Ratio
                  </label>
                  <select
                    id="editor-aspect-ratio"
                    value={aspectRatio}
                    onChange={(e) => onChangeAspectRatio(e.target.value as SupportedAspectRatio)}
                    className="w-full rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#141413] focus:border-[#141413] focus:outline-none"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="editor-image-size"
                    className="block text-xs font-semibold text-[#141413] mb-1.5"
                  >
                    Resolution
                  </label>
                  <select
                    id="editor-image-size"
                    value={imageSize}
                    onChange={(e) => onChangeImageSize(e.target.value as ImageResolution)}
                    className="w-full rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#141413] focus:border-[#141413] focus:outline-none"
                  >
                    {RESOLUTIONS.map((res) => (
                      <option key={res} value={res}>
                        {res} Output
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-[#C84B31]/30 bg-[#C84B31]/5 p-3 text-xs text-[#9E351F]">
                  {errorMessage}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onRunPrompt}
              disabled={isProcessing || !prompt.trim()}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#141413] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2B2B29] disabled:opacity-50 whitespace-nowrap"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {isProcessing
                  ? 'Running gemini-nano-banana-2.1...'
                  : mode === 'edit'
                  ? 'Apply Prompt Edit'
                  : 'Generate Image'}
              </span>
            </button>
          </div>

          {/* Right Output Canvas & Filmstrip */}
          <div className="lg:col-span-7 flex flex-col rounded-xl border border-[#E5E3DC] bg-[#FFFFFF]">
            <div className="flex items-center justify-between border-b border-[#E5E3DC] px-5 py-3.5">
              <span className="font-mono text-xs text-[#5E5D59]">
                {activeResult
                  ? `${activeResult.mode === 'edit' ? 'Edited' : 'Created'} · ${activeResult.aspectRatio} · ${activeResult.imageSize}`
                  : 'Editor Output Viewport'}
              </span>
              {activeResult && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPromoteToLogo(activeResult.imageUrl)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E3DC] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] whitespace-nowrap"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#C84B31]" aria-hidden="true" />
                    <span>Use as Studio Logo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(activeResult.imageUrl, `presshouse-edit-${activeResult.id}.png`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E3DC] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5 text-[#5E5D59]" aria-hidden="true" />
                    <span>Download PNG</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex flex-1 min-h-[380px] items-center justify-center bg-[#F4F3EE] p-6">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#C84B31]" aria-hidden="true" />
                  <p className="font-display text-sm font-semibold text-[#141413]">
                    Synthesizing {imageSize} image via gemini-nano-banana-2.1
                  </p>
                </div>
              ) : activeResult ? (
                <img
                  src={activeResult.imageUrl}
                  alt={activeResult.prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[460px] w-auto rounded-lg object-contain shadow-sm"
                />
              ) : sourceImageUrl && mode === 'edit' ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <img
                    src={sourceImageUrl}
                    alt="Reference image ready for editing"
                    referrerPolicy="no-referrer"
                    className="max-h-[340px] w-auto rounded-lg object-contain border border-[#E5E3DC] bg-[#FFFFFF] p-2"
                  />
                  <p className="text-xs text-[#5E5D59]">
                    Reference loaded. Enter your edit prompt and click Apply Prompt Edit.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                  <ImagePlus className="h-8 w-8 text-[#71706B]" aria-hidden="true" />
                  <p className="font-display text-sm font-semibold text-[#141413]">
                    Ready to create or edit imagery
                  </p>
                  <p className="text-xs leading-relaxed text-[#5E5D59]">
                    Write a prompt on the left to restyle your logo, refine an AI mockup, or generate fresh merchandise graphics.
                  </p>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="border-t border-[#E5E3DC] px-5 py-3.5">
                <p className="mb-2 text-[11px] font-medium text-[#71706B]">
                  Recent Iterations ({history.length})
                </p>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedHistoryId(item.id);
                        onChangeSourceImage(item.imageUrl);
                      }}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                        activeResult?.id === item.id
                          ? 'border-[#C84B31] ring-2 ring-[#C84B31]/20'
                          : 'border-[#E5E3DC] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
