import { Archive, Download, FileCheck2, Printer } from 'lucide-react';
import type { InkTreatment, LogoAsset, ProductSpec } from '../types/merch';

interface PrintExportSectionProps {
  logo: LogoAsset | null;
  product: ProductSpec;
  garmentColorName: string;
  printFinish: string;
  inkTreatment: InkTreatment;
  scalePct: number;
  offsetXPct: number;
  offsetYPct: number;
  proofPreviewUrl: string | null;
  isExporting: boolean;
  onDownloadPrintPng: () => void;
  onDownloadProofSheet: () => void;
  onDownloadZipPack: () => void;
}

export function PrintExportSection({
  logo,
  product,
  garmentColorName,
  printFinish,
  inkTreatment,
  scalePct,
  offsetXPct,
  offsetYPct,
  proofPreviewUrl,
  isExporting,
  onDownloadPrintPng,
  onDownloadProofSheet,
  onDownloadZipPack,
}: PrintExportSectionProps) {
  const pxW = Math.round(product.printWidthIn * product.dpi);
  const pxH = Math.round(product.printHeightIn * product.dpi);
  const mmW = Math.round(product.printWidthIn * 25.4);
  const mmH = Math.round(product.printHeightIn * 25.4);

  return (
    <section id="export" className="border-t border-[#E5E3DC] bg-[#FFFFFF] py-16">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#C84B31]">04. Pre-Press Production</p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#141413] sm:text-3xl text-balance">
              Export 300 DPI print-ready production files
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5E5D59]">
              Every mockup configuration automatically prepares a transparent 300 DPI raster print file at exact physical garment dimensions, complete with bleed margins, crop marks, and a press proof sheet.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          {/* Proof Preview */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden rounded-xl border border-[#E5E3DC] bg-[#F7F6F2]">
            <div className="flex items-center justify-between border-b border-[#E5E3DC] bg-[#FFFFFF] px-5 py-3">
              <span className="font-mono text-xs font-medium text-[#141413]">
                Press Proof Sheet Preview
              </span>
              <span className="font-mono text-xs text-[#5E5D59] tabular-nums">
                {product.printWidthIn}&quot; × {product.printHeightIn}&quot; · {product.dpi} DPI
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center p-6 studio-checkerboard">
              {proofPreviewUrl ? (
                <img
                  src={proofPreviewUrl}
                  alt="Press proof sheet with crop marks and technical specifications"
                  referrerPolicy="no-referrer"
                  className="max-h-[420px] w-auto rounded border border-[#E5E3DC] bg-[#FFFFFF] shadow-xs"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center py-12">
                  <Printer className="h-7 w-7 text-[#71706B]" aria-hidden="true" />
                  <p className="text-xs text-[#5E5D59]">
                    Upload or select a logo to generate your live press proof sheet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Spec Sheet & Export Buttons */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#E5E3DC] bg-[#FFFFFF] p-6">
            <div>
              <h3 className="font-display text-base font-semibold text-[#141413]">
                Production Specification
              </h3>
              <dl className="mt-4 divide-y divide-[#EAE8E0] text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Artwork Source</dt>
                  <dd className="font-medium text-[#141413] truncate max-w-[200px]">
                    {logo?.name || 'None'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Product &amp; Colorway</dt>
                  <dd className="font-medium text-[#141413]">
                    {product.name} · {garmentColorName}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Print Technique</dt>
                  <dd className="font-medium text-[#141413]">{printFinish}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Physical Trim Size</dt>
                  <dd className="font-mono text-xs text-[#141413] tabular-nums">
                    {product.printWidthIn}&quot; × {product.printHeightIn}&quot; ({mmW} × {mmH} mm)
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Print Pixel Matrix</dt>
                  <dd className="font-mono text-xs text-[#141413] tabular-nums">
                    {pxW} × {pxH} px @ {product.dpi} DPI
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Bleed &amp; Ink Mode</dt>
                  <dd className="font-mono text-xs text-[#141413] tabular-nums">
                    {product.bleedIn}&quot; bleed · {inkTreatment}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#5E5D59]">Placement Transform</dt>
                  <dd className="font-mono text-xs text-[#141413] tabular-nums">
                    {scalePct}% scale · X {offsetXPct}% / Y {offsetYPct}%
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={onDownloadPrintPng}
                disabled={!logo || isExporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#141413] transition-colors hover:bg-[#F7F6F2] disabled:opacity-50 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5 text-[#5E5D59]" aria-hidden="true" />
                <span>Download 300 DPI Transparent Print PNG</span>
              </button>

              <button
                type="button"
                onClick={onDownloadProofSheet}
                disabled={!logo || isExporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E3DC] bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold text-[#141413] transition-colors hover:bg-[#F7F6F2] disabled:opacity-50 whitespace-nowrap"
              >
                <FileCheck2 className="h-3.5 w-3.5 text-[#5E5D59]" aria-hidden="true" />
                <span>Download Press Proof Sheet (Crop &amp; Bleed Marks)</span>
              </button>

              <button
                type="button"
                onClick={onDownloadZipPack}
                disabled={!logo || isExporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#141413] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2B2B29] disabled:opacity-50 whitespace-nowrap"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isExporting ? 'Bundling ZIP...' : 'Download Full Print Pack (.ZIP)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
