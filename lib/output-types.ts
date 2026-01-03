// Output type definitions for rich output rendering

export type OutputType = 'text' | 'table' | 'chart' | 'html' | 'error' | 'json' | 'visualization';

export interface RichOutputData {
  type: OutputType;
  data: any;
  metadata?: {
    rows?: number;
    columns?: string[];
    chartType?: string;
    visualizationType?: 'array' | 'object' | 'tree' | 'graph';
  };
}

export interface TableData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  isNested?: boolean;
}

export interface VisualizationData {
  dataType: 'array' | 'object' | 'tree' | 'graph';
  data: any;
  metadata?: {
    length?: number;
    depth?: number;
    keys?: string[];
  };
}

export interface ChartData {
  type: 'matplotlib' | 'plotly' | 'image';
  data: string; // base64 or HTML
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
}
