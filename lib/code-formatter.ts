/**
 * Code Formatting Utilities
 * Prettier for TS/JS, Black via Pyodide for Python
 */

import { format as prettierFormat } from 'prettier/standalone';
import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginTypeScript from 'prettier/plugins/typescript';
import prettierPluginEstree from 'prettier/plugins/estree';

// Format TypeScript/JavaScript code using Prettier
export async function formatTypeScript(code: string): Promise<string> {
  try {
    const formatted = await prettierFormat(code, {
      parser: 'typescript',
      plugins: [prettierPluginBabel, prettierPluginTypeScript, prettierPluginEstree] as any,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
    });
    return formatted;
  } catch (error) {
    console.warn('Prettier formatting failed:', error);
    return code; // Return original code if formatting fails
  }
}

export async function formatJavaScript(code: string): Promise<string> {
  try {
    const formatted = await prettierFormat(code, {
      parser: 'babel',
      plugins: [prettierPluginBabel, prettierPluginEstree] as any,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
    });
    return formatted;
  } catch (error) {
    console.warn('Prettier formatting failed:', error);
    return code;
  }
}

// Format Python code using Black via Pyodide
// This requires the Pyodide worker to have black installed
export async function formatPython(code: string): Promise<string> {
  // We'll call the pyodide worker to format with black
  // For now, return the code as-is and let the worker handle it
  try {
    const { formatPythonCode } = await import('./pyodide');
    return await formatPythonCode(code);
  } catch (error) {
    console.warn('Python formatting failed:', error);
    return code;
  }
}

// Main format function that routes to the correct formatter
export async function formatCode(code: string, language: string): Promise<string> {
  switch (language) {
    case 'typescript':
      return formatTypeScript(code);
    case 'javascript':
      return formatJavaScript(code);
    case 'python':
      return formatPython(code);
    default:
      return code;
  }
}
