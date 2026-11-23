export type ProductId = 'hoodie' | 'tee' | 'tote' | 'mug';

export type PrintFinish =
  | 'Waterbased Matte Screenprint'
  | 'High-Density Puff Ink'
  | 'Chainstitch Embroidery'
  | 'Distressed Vintage Halftone'
  | 'Kiln Ceramic Decal';

export type InkTreatment = 'original' | 'charcoal' | 'chalk' | 'vermilion' | 'halftone';

export type ImageResolution = '1K' | '2K' | '4K';

export type SupportedAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '4:1' | '1:4';

export interface ProductSpec {
  id: ProductId;
  name: string;
  subtitle: string;
  material: string;
  blankImageUrl: string;
  defaultColorName: string;
  colorSwatches: Array<{ name: string; hex: string }>;
  printWidthIn: number;
  printHeightIn: number;
  bleedIn: number;
  dpi: number;
  defaultFinish: PrintFinish;
  overlayBox: {
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
  };
}

export interface LogoAsset {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface VariationSpec {
  id: string;
  indexLabel: string;
  title: string;
  productId: ProductId;
  productLabel: string;
  arrangement: string;
  printStyle: string;
  paletteName: string;
  garmentColorName: string;
  paletteHexes: string[];
  artDirectionPrompt: string;
  inkTreatment: InkTreatment;
  scalePct: number;
  offsetXPct: number;
  offsetYPct: number;
  status: 'idle' | 'generating' | 'ready' | 'error';
  generatedImageUrl?: string;
  errorMessage?: string;
}

export interface EditorHistoryItem {
  id: string;
  prompt: string;
  mode: 'create' | 'edit';
  aspectRatio: SupportedAspectRatio;
  imageSize: ImageResolution;
  imageUrl: string;
  createdAt: string;
}
