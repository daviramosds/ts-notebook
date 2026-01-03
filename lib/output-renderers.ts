import { OutputType, TableData, VisualizationData, RichOutputData } from './output-types';

/**
 * Detect the type of output for appropriate rendering
 */
export function detectOutputType(output: any): OutputType {
  if (!output) return 'text';

  // Error detection
  if (output.error || output instanceof Error) return 'error';

  // Array detection - could be table
  if (Array.isArray(output)) {
    // Check if it's an array of objects (table candidate)
    if (output.length > 0 && typeof output[0] === 'object' && output[0] !== null) {
      return 'table';
    }
    return 'json'; // Simple array
  }

  // Object detection
  if (typeof output === 'object' && output !== null) {
    // Check if it's a plain object (could be table or json)
    const keys = Object.keys(output);
    if (keys.length > 0) {
      // If all values are primitives or arrays, could be a table
      const firstValue = output[keys[0]];
      if (Array.isArray(firstValue)) {
        return 'table';
      }
      return 'json';
    }
  }

  // String detection
  if (typeof output === 'string') {
    // Try to detect JSON
    if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
      try {
        JSON.parse(output);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // Check for HTML
    if (output.trim().startsWith('<')) {
      return 'html';
    }

    return 'text';
  }

  return 'text';
}

/**
 * Format array or object as table data
 */
export function formatAsTableData(data: any): TableData | null {
  if (!data) return null;

  // Handle array of objects
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];

    if (typeof firstItem === 'object' && firstItem !== null) {
      const headers = Object.keys(firstItem);
      const rows = data.map(item =>
        headers.map(header => {
          const value = item[header];
          // Handle nested objects/arrays
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value;
        })
      );

      return {
        headers,
        rows,
        totalRows: data.length,
        isNested: data.some(item =>
          Object.values(item).some(v => typeof v === 'object' && v !== null)
        )
      };
    }

    // Handle simple array
    return {
      headers: ['Index', 'Value'],
      rows: data.map((value, index) => [
        index,
        typeof value === 'object' ? JSON.stringify(value) : value
      ]),
      totalRows: data.length
    };
  }

  // Handle object as single-row table or key-value pairs
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    return {
      headers: ['Key', 'Value'],
      rows: entries.map(([key, value]) => [
        key,
        typeof value === 'object' ? JSON.stringify(value) : value
      ]),
      totalRows: entries.length
    };
  }

  return null;
}

/**
 * Pretty print JSON with indentation
 */
export function prettyPrintJSON(obj: any): string {
  try {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * Detect if a string contains code
 */
export function isCodeString(str: string): boolean {
  if (typeof str !== 'string') return false;

  // Simple heuristics
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /class\s+\w+/,
    /import\s+.*\s+from/,
    /=>\s*{/,
  ];

  return codePatterns.some(pattern => pattern.test(str));
}

/**
 * Extract visualization data from result
 */
export function extractVisualizationData(result: any): VisualizationData | null {
  if (!result) return null;

  // Array visualization
  if (Array.isArray(result)) {
    return {
      dataType: 'array',
      data: result,
      metadata: {
        length: result.length,
        depth: getArrayDepth(result)
      }
    };
  }

  // Object visualization
  if (typeof result === 'object' && result !== null) {
    const keys = Object.keys(result);
    return {
      dataType: 'object',
      data: result,
      metadata: {
        keys,
        depth: getObjectDepth(result)
      }
    };
  }

  return null;
}

/**
 * Get the depth of nested arrays
 */
function getArrayDepth(arr: any[]): number {
  if (!Array.isArray(arr)) return 0;
  if (arr.length === 0) return 1;

  const depths = arr.map(item =>
    Array.isArray(item) ? getArrayDepth(item) + 1 : 1
  );

  return Math.max(...depths);
}

/**
 * Get the depth of nested objects
 */
function getObjectDepth(obj: any): number {
  if (typeof obj !== 'object' || obj === null) return 0;

  const depths = Object.values(obj).map(value =>
    typeof value === 'object' && value !== null ? getObjectDepth(value) + 1 : 1
  );

  return depths.length > 0 ? Math.max(...depths) : 1;
}

/**
 * Process rich outputs from Python execution
 */
export function processRichOutputs(richOutputs: any[]): RichOutputData[] {
  if (!richOutputs || !Array.isArray(richOutputs)) return [];

  return richOutputs.map(output => {
    // Matplotlib images
    if (output.type === 'image') {
      return {
        type: 'chart',
        data: output.data,
        metadata: {
          chartType: 'matplotlib'
        }
      };
    }

    // HTML outputs (pandas, plotly)
    if (output.type === 'html') {
      // Detect if it's a pandas table
      if (output.data.includes('dataframe') || output.data.includes('pandas-table')) {
        return {
          type: 'table',
          data: output.data,
          metadata: output.metadata
        };
      }

      // Plotly or other HTML
      return {
        type: 'html',
        data: output.data,
        metadata: output.metadata
      };
    }

    return {
      type: 'text',
      data: output.data
    };
  });
}
