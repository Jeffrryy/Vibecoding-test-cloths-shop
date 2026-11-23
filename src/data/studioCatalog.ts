import type { ProductSpec, VariationSpec } from '../types/merch';

const ASSET_BASE = import.meta.env.BASE_URL || '/';

export const PRODUCT_CATALOG: ProductSpec[] = [
  {
    id: 'hoodie',
    name: 'Heavyweight Fleece Hoodie',
    subtitle: '480 GSM Organic Cotton',
    material: 'Brushed Loopback Fleece',
    blankImageUrl: `${ASSET_BASE}src/assets/images/mockup_heavy_hoodie_1795421426870.jpg`,
    defaultColorName: 'Heather Ash',
    colorSwatches: [
      { name: 'Heather Ash', hex: '#B9B9B6' },
      { name: 'Charcoal Ink', hex: '#262625' },
      { name: 'Bone Chalk', hex: '#ECE9E1' },
      { name: 'Forest Moss', hex: '#2F3E34' },
    ],
    printWidthIn: 12,
    printHeightIn: 14,
    bleedIn: 0.25,
    dpi: 300,
    defaultFinish: 'High-Density Puff Ink',
    overlayBox: { xPct: 50, yPct: 44, widthPct: 24, heightPct: 22 },
  },
  {
    id: 'tee',
    name: 'Boxy Crewneck Tee',
    subtitle: '290 GSM Combed Jersey',
    material: 'Garment-Dyed Heavy Jersey',
    blankImageUrl: `${ASSET_BASE}src/assets/images/mockup_organic_tee_1795421426971.jpg`,
    defaultColorName: 'Washed Charcoal',
    colorSwatches: [
      { name: 'Washed Charcoal', hex: '#333436' },
      { name: 'Warm Chalk', hex: '#EFECE6' },
      { name: 'Slate Navy', hex: '#27313F' },
      { name: 'Clay Ochre', hex: '#9A6B52' },
    ],
    printWidthIn: 11,
    printHeightIn: 13,
    bleedIn: 0.25,
    dpi: 300,
    defaultFinish: 'Waterbased Matte Screenprint',
    overlayBox: { xPct: 50, yPct: 42, widthPct: 25, heightPct: 24 },
  },
  {
    id: 'tote',
    name: 'Unbleached Canvas Tote',
    subtitle: '16 oz Bull Denim Twill',
    material: 'Unbleached Organic Canvas',
    blankImageUrl: `${ASSET_BASE}src/assets/images/mockup_canvas_tote_1795421426699.jpg`,
    defaultColorName: 'Raw Natural',
    colorSwatches: [
      { name: 'Raw Natural', hex: '#E6DEC8' },
      { name: 'Coal Black', hex: '#1F1F1E' },
      { name: 'Olive Drab', hex: '#545B49' },
      { name: 'Oxblood Red', hex: '#692E2B' },
    ],
    printWidthIn: 10,
    printHeightIn: 10,
    bleedIn: 0.25,
    dpi: 300,
    defaultFinish: 'Waterbased Matte Screenprint',
    overlayBox: { xPct: 50, yPct: 56, widthPct: 22, heightPct: 22 },
  },
  {
    id: 'mug',
    name: 'Stoneware Studio Mug',
    subtitle: '12 oz Matte Glaze Ceramic',
    material: 'Kiln-Fired Stoneware',
    blankImageUrl: `${ASSET_BASE}src/assets/images/mockup_ceramic_mug_1795421426370.jpg`,
    defaultColorName: 'Speckled Cream',
    colorSwatches: [
      { name: 'Speckled Cream', hex: '#E7E2D6' },
      { name: 'Basalt Matte', hex: '#2D2C2A' },
      { name: 'Terracotta Clay', hex: '#A95D45' },
      { name: 'Cobalt Glaze', hex: '#2A4766' },
    ],
    printWidthIn: 8.5,
    printHeightIn: 3.75,
    bleedIn: 0.125,
    dpi: 300,
    defaultFinish: 'Kiln Ceramic Decal',
    overlayBox: { xPct: 47, yPct: 56, widthPct: 16, heightPct: 18 },
  },
];

export const PRINT_FINISH_OPTIONS = [
  'Waterbased Matte Screenprint',
  'High-Density Puff Ink',
  'Chainstitch Embroidery',
  'Distressed Vintage Halftone',
  'Kiln Ceramic Decal',
] as const;

export const DEFAULT_VARIATION_TEMPLATES: VariationSpec[] = [
  {
    id: 'var-1',
    indexLabel: '01.',
    title: 'Classic Center Chest',
    productId: 'hoodie',
    productLabel: 'Heavyweight Fleece Hoodie',
    arrangement: 'Centered chest lockup (3.5" below collar seam)',
    printStyle: 'High-Density Puff Ink',
    paletteName: 'Monochrome Obsidian',
    garmentColorName: 'Heather Ash',
    paletteHexes: ['#B9B9B6', '#141413', '#F4F3EE'],
    artDirectionPrompt:
      'Place the logo centered on the chest of a heather-ash heavyweight cotton hoodie in raised matte black high-density puff ink with crisp fabric shadow relief.',
    inkTreatment: 'charcoal',
    scalePct: 100,
    offsetXPct: 0,
    offsetYPct: 0,
    status: 'idle',
  },
  {
    id: 'var-2',
    indexLabel: '02.',
    title: 'Left Pocket Crest',
    productId: 'tee',
    productLabel: 'Boxy Crewneck Tee',
    arrangement: 'Compact left-chest pocket crest with subtle tonal stitch edge',
    printStyle: 'Chainstitch Embroidery',
    paletteName: 'Studio Chalk & Charcoal',
    garmentColorName: 'Washed Charcoal',
    paletteHexes: ['#333436', '#F2EFE9', '#C84B31'],
    artDirectionPrompt:
      'Embroider the logo cleanly as a 3.8-inch left-chest crest onto a boxy washed charcoal heavyweight t-shirt using textured warm-chalk and vermilion thread stitches.',
    inkTreatment: 'chalk',
    scalePct: 48,
    offsetXPct: 15,
    offsetYPct: -10,
    status: 'idle',
  },
  {
    id: 'var-3',
    indexLabel: '03.',
    title: 'Oversized Editorial Print',
    productId: 'tote',
    productLabel: 'Unbleached Canvas Tote',
    arrangement: 'Full-width bold graphic anchored squarely between tote straps',
    printStyle: 'Waterbased Matte Screenprint',
    paletteName: 'Vermilion Press Ink',
    garmentColorName: 'Raw Natural',
    paletteHexes: ['#E6DEC8', '#C84B31', '#1A1918'],
    artDirectionPrompt:
      'Screenprint an oversized bold version of the logo in rich vermilion red and deep charcoal ink onto an unbleached 16oz cotton canvas tote bag, showing canvas grain through the ink.',
    inkTreatment: 'vermilion',
    scalePct: 122,
    offsetXPct: 0,
    offsetYPct: 2,
    status: 'idle',
  },
  {
    id: 'var-4',
    indexLabel: '04.',
    title: 'Vintage Halftone Seal',
    productId: 'tee',
    productLabel: 'Boxy Crewneck Tee',
    arrangement: 'Mid-chest graphic with fine 45-line halftone dot softening',
    printStyle: 'Distressed Vintage Halftone',
    paletteName: 'Aged Bone & Charcoal',
    garmentColorName: 'Slate Navy',
    paletteHexes: ['#27313F', '#DFD9CA', '#8F8A7E'],
    artDirectionPrompt:
      'Apply the logo onto a vintage slate-navy heavyweight crewneck t-shirt using a soft-hand distressed halftone plastisol print in aged bone ink with authentic knit texture.',
    inkTreatment: 'halftone',
    scalePct: 108,
    offsetXPct: 0,
    offsetYPct: -2,
    status: 'idle',
  },
  {
    id: 'var-5',
    indexLabel: '05.',
    title: 'Kiln Studio Emblem',
    productId: 'mug',
    productLabel: 'Stoneware Studio Mug',
    arrangement: 'Crisp front-facing emblem centered on curved stoneware wall',
    printStyle: 'Kiln Ceramic Decal',
    paletteName: 'Cobalt & Speckled Cream',
    garmentColorName: 'Speckled Cream',
    paletteHexes: ['#E7E2D6', '#1F3A52', '#141413'],
    artDirectionPrompt:
      'Bake the logo cleanly onto the matte speckled-cream stoneware ceramic mug as a subtle recessed kiln-fired cobalt and charcoal ceramic transfer respecting the cylindrical curve.',
    inkTreatment: 'original',
    scalePct: 86,
    offsetXPct: 0,
    offsetYPct: 0,
    status: 'idle',
  },
];

export interface SampleLogoDefinition {
  id: string;
  name: string;
  category: string;
  svg: string;
}

export const SAMPLE_LOGOS: SampleLogoDefinition[] = [
  {
    id: 'kurogane',
    name: 'Kurogane Roasters',
    category: 'Specialty Coffee',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect x="44" y="44" width="312" height="312" rx="18" fill="none" stroke="#141413" stroke-width="14"/>
      <circle cx="200" cy="158" r="56" fill="#C84B31"/>
      <path d="M168 158 C184 126, 216 126, 232 158 C216 190, 184 190, 168 158 Z" fill="#F7F6F2"/>
      <text x="200" y="268" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-weight="800" font-size="38" letter-spacing="4" fill="#141413">KUROGANE</text>
      <text x="200" y="304" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="600" font-size="16" letter-spacing="6" fill="#5E5D59">TOKYO ROASTERY</text>
    </svg>`,
  },
  {
    id: 'northwind',
    name: 'Northwind Alpine',
    category: 'Outdoor Gear',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <circle cx="200" cy="200" r="154" fill="#18222D"/>
      <polygon points="200,82 296,238 104,238" fill="none" stroke="#F7F6F2" stroke-width="12" stroke-linejoin="round"/>
      <polygon points="200,136 254,238 146,238" fill="#C84B31"/>
      <text x="200" y="286" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-weight="800" font-size="30" letter-spacing="5" fill="#F7F6F2">NORTHWIND</text>
      <text x="200" y="314" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="500" font-size="13" letter-spacing="4" fill="#A6B1BD">ELEV. 4200M</text>
    </svg>`,
  },
  {
    id: 'solstice',
    name: 'Solstice Pressing',
    category: 'Vinyl Label',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <circle cx="200" cy="170" r="96" fill="none" stroke="#141413" stroke-width="12"/>
      <circle cx="200" cy="170" r="64" fill="none" stroke="#141413" stroke-width="6"/>
      <circle cx="200" cy="170" r="30" fill="#141413"/>
      <circle cx="200" cy="170" r="10" fill="#F7F6F2"/>
      <rect x="64" y="286" width="272" height="52" fill="#141413"/>
      <text x="200" y="321" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-weight="700" font-size="25" letter-spacing="6" fill="#F7F6F2">SOLSTICE</text>
    </svg>`,
  },
];
