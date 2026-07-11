// MicrosoftPaint constants (#163/A).

/** Default folder for File → Save (我的文档/我的图片). */
export const DEFAULT_SAVE_DIR = ['我的文档', '我的图片'];

/** The classic 16-colour Paint palette. */
export const PALETTE_COLORS = [
  '#000000', '#808080', '#c0c0c0', '#ffffff',
  '#800000', '#ff0000', '#808000', '#ffff00',
  '#008000', '#00ff00', '#008080', '#00ffff',
  '#000080', '#0000ff', '#800080', '#ff00ff',
];

/** Drawing tools (label is an i18n key suffix under `paint.tools`). */
export const TOOLS: Array<{ id: string; label: string }> = [
  { id: 'brush', label: 'brush' },
  { id: 'line', label: 'line' },
  { id: 'rectangle', label: 'rectangle' },
  { id: 'circle', label: 'circle' },
];
