import JSZip from 'jszip';
import type { InkTreatment, LogoAsset, ProductSpec, VariationSpec } from '../types/merch';

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for processing.'));
    img.src = src;
  });
}

/**
 * Converts an uploaded image file or SVG string into a clean PNG LogoAsset
 * so Gemini nano-banana-2.1 and Canvas exporters both receive crisp raster PNGs.
 */
export async function normalizeLogoToPng(
  sourceUrl: string,
  name: string,
  id: string
): Promise<LogoAsset> {
  const img = await loadImageElement(sourceUrl);
  const naturalW = img.naturalWidth || 1024;
  const naturalH = img.naturalHeight || 1024;

  // Normalize max dimension to 1200px for crisp quality & fast API payloads
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
  const targetW = Math.max(1, Math.round(naturalW * scale));
  const targetH = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const pngDataUrl = canvas.toDataURL('image/png');
  return {
    id,
    name,
    dataUrl: pngDataUrl,
    mimeType: 'image/png',
    width: targetW,
    height: targetH,
  };
}

export async function svgStringToLogoAsset(svg: string, name: string, id: string): Promise<LogoAsset> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(svgBlob);
  try {
    return await normalizeLogoToPng(objectUrl, name, id);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load asset: ${url}`);
  const blob = await res.blob();
  const mimeType = blob.type || 'image/jpeg';
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read blob as base64.'));
    reader.readAsDataURL(blob);
  });
  const commaIdx = dataUrl.indexOf(',');
  return { base64: commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl, mimeType };
}

function drawLogoWithInkTreatment(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  treatment: InkTreatment
) {
  if (treatment === 'original') {
    ctx.drawImage(logoImg, dx, dy, dw, dh);
    return;
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = Math.max(1, Math.round(dw));
  tempCanvas.height = Math.max(1, Math.round(dh));
  const tctx = tempCanvas.getContext('2d');
  if (!tctx) {
    ctx.drawImage(logoImg, dx, dy, dw, dh);
    return;
  }

  tctx.drawImage(logoImg, 0, 0, tempCanvas.width, tempCanvas.height);

  if (treatment === 'charcoal' || treatment === 'chalk' || treatment === 'vermilion') {
    const tint =
      treatment === 'charcoal' ? '#141413' : treatment === 'chalk' ? '#F7F6F2' : '#C84B31';
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = tint;
    tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tctx.globalCompositeOperation = 'source-over';
  } else if (treatment === 'halftone') {
    const imgData = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;
    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        const idx = (y * tempCanvas.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 10) {
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const halftoneMask = (x + y) % 6 < 2 ? 0.72 : 1;
          data[idx] = Math.min(255, Math.round(lum * 0.25 + 180));
          data[idx + 1] = Math.min(255, Math.round(lum * 0.25 + 175));
          data[idx + 2] = Math.min(255, Math.round(lum * 0.25 + 162));
          data[idx + 3] = Math.round(alpha * halftoneMask);
        }
      }
    }
    tctx.putImageData(imgData, 0, 0);
  }

  ctx.drawImage(tempCanvas, dx, dy, dw, dh);
}

/**
 * Generates a real 300 DPI print-ready transparent PNG at physical print pixel dimensions.
 */
export async function renderPrintReadyArtworkPng(params: {
  logoDataUrl: string;
  product: ProductSpec;
  scalePct: number;
  offsetXPct: number;
  offsetYPct: number;
  inkTreatment: InkTreatment;
}): Promise<{ dataUrl: string; pixelWidth: number; pixelHeight: number }> {
  const { logoDataUrl, product, scalePct, offsetXPct, offsetYPct, inkTreatment } = params;
  const pixelWidth = Math.round(product.printWidthIn * product.dpi);
  const pixelHeight = Math.round(product.printHeightIn * product.dpi);

  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.clearRect(0, 0, pixelWidth, pixelHeight);
  const logoImg = await loadImageElement(logoDataUrl);

  const safeMarginPx = Math.round(product.bleedIn * product.dpi);
  const maxDrawW = pixelWidth - safeMarginPx * 2;
  const maxDrawH = pixelHeight - safeMarginPx * 2;
  const imgRatio = logoImg.width / Math.max(1, logoImg.height);
  const boxRatio = maxDrawW / Math.max(1, maxDrawH);

  let baseW = maxDrawW;
  let baseH = maxDrawW / imgRatio;
  if (imgRatio < boxRatio) {
    baseH = maxDrawH;
    baseW = maxDrawH * imgRatio;
  }

  const factor = Math.max(0.2, Math.min(1.5, scalePct / 100));
  const drawW = baseW * factor;
  const drawH = baseH * factor;

  const centerX = pixelWidth / 2 + (offsetXPct / 100) * (pixelWidth * 0.3);
  const centerY = pixelHeight / 2 + (offsetYPct / 100) * (pixelHeight * 0.3);

  drawLogoWithInkTreatment(
    ctx,
    logoImg,
    centerX - drawW / 2,
    centerY - drawH / 2,
    drawW,
    drawH,
    inkTreatment
  );

  return {
    dataUrl: canvas.toDataURL('image/png'),
    pixelWidth,
    pixelHeight,
  };
}

/**
 * Generates a print-shop Press Proof Sheet with crop marks, bleed lines, registration targets, and specs.
 */
export async function renderPressProofSheet(params: {
  logoDataUrl: string;
  product: ProductSpec;
  scalePct: number;
  offsetXPct: number;
  offsetYPct: number;
  inkTreatment: InkTreatment;
  printFinish: string;
  garmentColorName: string;
  paletteHexes: string[];
}): Promise<string> {
  const {
    logoDataUrl,
    product,
    scalePct,
    offsetXPct,
    offsetYPct,
    inkTreatment,
    printFinish,
    garmentColorName,
    paletteHexes,
  } = params;

  const sheetW = 1800;
  const sheetH = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // Crisp studio paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetW, sheetH);

  // Header band
  ctx.fillStyle = '#141413';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PRESSHOUSE STUDIO — PRODUCTION PRINT PROOF', 72, 82);

  ctx.fillStyle = '#5E5D59';
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText(
    `${product.name.toUpperCase()}  |  ${product.printWidthIn}" x ${product.printHeightIn}" @ ${product.dpi} DPI  |  BLEED ${product.bleedIn}"`,
    72,
    118
  );

  ctx.strokeStyle = '#E5E3DC';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, 146);
  ctx.lineTo(sheetW - 72, 146);
  ctx.stroke();

  // Print Area Frame (scaled to fit nicely)
  const artAreaMaxW = 920;
  const artAreaMaxH = 980;
  const aspect = product.printWidthIn / product.printHeightIn;
  let frameW = artAreaMaxW;
  let frameH = artAreaMaxW / aspect;
  if (frameH > artAreaMaxH) {
    frameH = artAreaMaxH;
    frameW = artAreaMaxH * aspect;
  }

  const frameX = 110;
  const frameY = 200;

  // Tinted garment substrate swatch preview inside print zone
  ctx.fillStyle = '#F4F3EE';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // Trim / Bleed Guides
  const bleedPx = (product.bleedIn / product.printWidthIn) * frameW;
  ctx.save();
  ctx.strokeStyle = '#C84B31';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(
    frameX + bleedPx,
    frameY + bleedPx,
    frameW - bleedPx * 2,
    frameH - bleedPx * 2
  );
  ctx.restore();

  // Outer trim border
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Corner Crop Marks
  const mark = 26;
  const gap = 10;
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 2;
  const corners = [
    [frameX, frameY, -1, -1],
    [frameX + frameW, frameY, 1, -1],
    [frameX, frameY + frameH, -1, 1],
    [frameX + frameW, frameY + frameH, 1, 1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * gap, cy);
    ctx.lineTo(cx + sx * (gap + mark), cy);
    ctx.moveTo(cx, cy + sy * gap);
    ctx.lineTo(cx, cy + sy * (gap + mark));
    ctx.stroke();
  }

  // Registration Target (Top Center & Bottom Center)
  const drawRegTarget = (tx: number, ty: number) => {
    ctx.strokeStyle = '#141413';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tx, ty, 11, 0, Math.PI * 2);
    ctx.moveTo(tx - 17, ty);
    ctx.lineTo(tx + 17, ty);
    ctx.moveTo(tx, ty - 17);
    ctx.lineTo(tx, ty + 17);
    ctx.stroke();
  };
  drawRegTarget(frameX + frameW / 2, frameY - 26);
  drawRegTarget(frameX + frameW / 2, frameY + frameH + 26);

  // Render artwork inside safe print area
  const artwork = await renderPrintReadyArtworkPng({
    logoDataUrl,
    product,
    scalePct,
    offsetXPct,
    offsetYPct,
    inkTreatment,
  });
  const artImg = await loadImageElement(artwork.dataUrl);
  ctx.drawImage(artImg, frameX, frameY, frameW, frameH);

  // Right-hand Technical Spec Table
  const specX = 1120;
  let specY = 220;

  const addSpecRow = (label: string, val: string) => {
    ctx.fillStyle = '#71706B';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText(label, specX, specY);
    ctx.fillStyle = '#141413';
    ctx.font = '600 22px "DM Sans", sans-serif';
    ctx.fillText(val, specX, specY + 30);
    ctx.strokeStyle = '#EAE8E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(specX, specY + 52);
    ctx.lineTo(sheetW - 72, specY + 52);
    ctx.stroke();
    specY += 84;
  };

  addSpecRow('GARMENT / PRODUCT', product.name);
  addSpecRow('SUBSTRATE COLORWAY', garmentColorName);
  addSpecRow('PRINT TECHNIQUE', printFinish);
  addSpecRow('TRIM DIMENSIONS', `${product.printWidthIn}" × ${product.printHeightIn}" (${Math.round(product.printWidthIn * 25.4)} × ${Math.round(product.printHeightIn * 25.4)} mm)`);
  addSpecRow('RASTER OUTPUT', `${artwork.pixelWidth} × ${artwork.pixelHeight} px @ ${product.dpi} DPI`);
  addSpecRow('SCALE / OFFSET', `${scalePct}% scale · X ${offsetXPct}% / Y ${offsetYPct}%`);

  // Ink Swatches
  ctx.fillStyle = '#71706B';
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillText('INK SEPARATION PALETTE', specX, specY + 8);
  paletteHexes.slice(0, 4).forEach((hex, idx) => {
    const bx = specX + idx * 145;
    const by = specY + 28;
    ctx.fillStyle = hex;
    ctx.fillRect(bx, by, 128, 54);
    ctx.strokeStyle = '#D6D4CC';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, 128, 54);
    ctx.fillStyle = '#141413';
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillText(hex.toUpperCase(), bx, by + 76);
  });

  // Footer note
  ctx.fillStyle = '#71706B';
  ctx.font = '400 15px "JetBrains Mono", monospace';
  ctx.fillText(
    'DASHED RED LINE = SAFE PRINT AREA  |  SOLID BORDER = TRIM EDGE  |  GENERATED BY PRESSHOUSE STUDIO',
    72,
    sheetH - 48
  );

  return canvas.toDataURL('image/png');
}

export function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportPrintPackZip(params: {
  logo: LogoAsset;
  product: ProductSpec;
  scalePct: number;
  offsetXPct: number;
  offsetYPct: number;
  inkTreatment: InkTreatment;
  printFinish: string;
  garmentColorName: string;
  paletteHexes: string[];
  activeMockupUrl?: string | null;
  variations: VariationSpec[];
}) {
  const zip = new JSZip();
  const slug = params.logo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand';

  // 1. 300 DPI Print Artwork PNG
  const artwork = await renderPrintReadyArtworkPng({
    logoDataUrl: params.logo.dataUrl,
    product: params.product,
    scalePct: params.scalePct,
    offsetXPct: params.offsetXPct,
    offsetYPct: params.offsetYPct,
    inkTreatment: params.inkTreatment,
  });
  const artBase64 = artwork.dataUrl.split(',')[1];
  zip.file(`01-print-artwork-300dpi-${params.product.id}.png`, artBase64, { base64: true });

  // 2. Press Proof Sheet PNG
  const proofUrl = await renderPressProofSheet({
    logoDataUrl: params.logo.dataUrl,
    product: params.product,
    scalePct: params.scalePct,
    offsetXPct: params.offsetXPct,
    offsetYPct: params.offsetYPct,
    inkTreatment: params.inkTreatment,
    printFinish: params.printFinish,
    garmentColorName: params.garmentColorName,
    paletteHexes: params.paletteHexes,
  });
  zip.file(`02-press-proof-sheet-${params.product.id}.png`, proofUrl.split(',')[1], { base64: true });

  // 3. Active AI Mockup Render (if generated)
  if (params.activeMockupUrl && params.activeMockupUrl.startsWith('data:')) {
    const ext = params.activeMockupUrl.includes('image/jpeg') ? 'jpg' : 'png';
    zip.file(`03-ai-product-mockup-${params.product.id}.${ext}`, params.activeMockupUrl.split(',')[1], {
      base64: true,
    });
  }

  // 4. Any generated variation mockups
  const varFolder = zip.folder('variations');
  params.variations.forEach((v, idx) => {
    if (varFolder && v.generatedImageUrl && v.generatedImageUrl.startsWith('data:')) {
      const ext = v.generatedImageUrl.includes('image/jpeg') ? 'jpg' : 'png';
      const vSlug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      varFolder.file(`variation-0${idx + 1}-${vSlug}.${ext}`, v.generatedImageUrl.split(',')[1], {
        base64: true,
      });
    }
  });

  // 5. Production Specification JSON & TXT
  const specJson = {
    brandLogo: params.logo.name,
    product: params.product.name,
    material: params.product.material,
    garmentColorway: params.garmentColorName,
    printTechnique: params.printFinish,
    physicalDimensionsInches: {
      width: params.product.printWidthIn,
      height: params.product.printHeightIn,
      bleed: params.product.bleedIn,
    },
    rasterPrintFile: {
      dpi: params.product.dpi,
      pixelWidth: artwork.pixelWidth,
      pixelHeight: artwork.pixelHeight,
      colorMode: 'sRGB PNG (Ready for RIP / CMYK Separation)',
    },
    placement: {
      scalePct: params.scalePct,
      offsetXPct: params.offsetXPct,
      offsetYPct: params.offsetYPct,
    },
    inkSwatches: params.paletteHexes,
    exportedAt: new Date().toISOString(),
  };

  zip.file('production-spec.json', JSON.stringify(specJson, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(content);
  triggerDownload(zipUrl, `${slug}-${params.product.id}-print-pack.zip`);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 4000);
}
