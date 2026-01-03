export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineNumbers: 'on' | 'off' | 'relative';
  minimap: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  tabSize: number;
  insertSpaces: boolean;
  formatOnSave: boolean;
  formatOnPaste: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  bracketPairColorization: boolean;
  cursorStyle: 'line' | 'block' | 'underline';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
  scrollBeyondLastLine: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  lineNumbers: 'on',
  minimap: false,
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
  formatOnSave: false,
  formatOnPaste: false,
  autoSave: true,
  autoSaveDelay: 3000,
  bracketPairColorization: true,
  cursorStyle: 'line',
  renderWhitespace: 'none',
  scrollBeyondLastLine: false,
};

export const FONT_FAMILIES = [
  { value: "'JetBrains Mono', 'Fira Code', monospace", label: 'JetBrains Mono' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: "'Monaco', monospace", label: 'Monaco' },
  { value: "'Consolas', monospace", label: 'Consolas' },
  { value: "monospace", label: 'System Monospace' },
];

export const CURSOR_STYLES = [
  { value: 'line' as const, label: 'Line' },
  { value: 'block' as const, label: 'Block' },
  { value: 'underline' as const, label: 'Underline' },
];

export const LINE_NUMBER_OPTIONS = [
  { value: 'on' as const, label: 'On' },
  { value: 'off' as const, label: 'Off' },
  { value: 'relative' as const, label: 'Relative' },
];

export const WORD_WRAP_OPTIONS = [
  { value: 'on' as const, label: 'On' },
  { value: 'off' as const, label: 'Off' },
  { value: 'bounded' as const, label: 'Bounded' },
  { value: 'wordWrapColumn' as const, label: 'At Column' },
];

export const WHITESPACE_OPTIONS = [
  { value: 'none' as const, label: 'None' },
  { value: 'boundary' as const, label: 'Boundary' },
  { value: 'selection' as const, label: 'Selection' },
  { value: 'all' as const, label: 'All' },
];

// Validation function
export function validateEditorSettings(settings: Partial<EditorSettings>): EditorSettings {
  return {
    fontSize: Math.min(Math.max(settings.fontSize ?? DEFAULT_EDITOR_SETTINGS.fontSize, 10), 30),
    fontFamily: settings.fontFamily ?? DEFAULT_EDITOR_SETTINGS.fontFamily,
    lineNumbers: settings.lineNumbers ?? DEFAULT_EDITOR_SETTINGS.lineNumbers,
    minimap: settings.minimap ?? DEFAULT_EDITOR_SETTINGS.minimap,
    wordWrap: settings.wordWrap ?? DEFAULT_EDITOR_SETTINGS.wordWrap,
    tabSize: [2, 4, 8].includes(settings.tabSize ?? 2) ? settings.tabSize! : 2,
    insertSpaces: settings.insertSpaces ?? DEFAULT_EDITOR_SETTINGS.insertSpaces,
    formatOnSave: settings.formatOnSave ?? DEFAULT_EDITOR_SETTINGS.formatOnSave,
    formatOnPaste: settings.formatOnPaste ?? DEFAULT_EDITOR_SETTINGS.formatOnPaste,
    autoSave: settings.autoSave ?? DEFAULT_EDITOR_SETTINGS.autoSave,
    autoSaveDelay: Math.min(Math.max(settings.autoSaveDelay ?? 3000, 1000), 10000),
    bracketPairColorization: settings.bracketPairColorization ?? DEFAULT_EDITOR_SETTINGS.bracketPairColorization,
    cursorStyle: settings.cursorStyle ?? DEFAULT_EDITOR_SETTINGS.cursorStyle,
    renderWhitespace: settings.renderWhitespace ?? DEFAULT_EDITOR_SETTINGS.renderWhitespace,
    scrollBeyondLastLine: settings.scrollBeyondLastLine ?? DEFAULT_EDITOR_SETTINGS.scrollBeyondLastLine,
  };
}
