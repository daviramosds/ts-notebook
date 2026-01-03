'use client';

import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { VisualizationData } from '@/lib/output-types';

interface ExecutionVisualizerProps {
  data: VisualizationData;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  lang: 'pt' | 'en';
}

const translations = {
  pt: {
    title: 'Visualização de Dados',
    array: 'Array',
    object: 'Objeto',
    length: 'Tamanho',
    depth: 'Profundidade',
    keys: 'Chaves',
    index: 'Índice',
    value: 'Valor',
    key: 'Chave'
  },
  en: {
    title: 'Data Visualization',
    array: 'Array',
    object: 'Object',
    length: 'Length',
    depth: 'Depth',
    keys: 'Keys',
    index: 'Index',
    value: 'Value',
    key: 'Key'
  }
};

const ExecutionVisualizer: React.FC<ExecutionVisualizerProps> = ({
  data,
  isOpen,
  onClose,
  theme,
  lang
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDark = theme === 'dark';
  const t = translations[lang];

  if (!isOpen) return null;

  const renderArrayVisualization = () => {
    const array = data.data as any[];
    const maxDisplay = 20; // Limit display for performance
    const displayArray = array.slice(0, maxDisplay);

    return (
      <div className="space-y-4">
        {/* Metadata */}
        <div className={`flex gap-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
          <span><strong>{t.length}:</strong> {array.length}</span>
          {data.metadata?.depth && (
            <span><strong>{t.depth}:</strong> {data.metadata.depth}</span>
          )}
        </div>

        {/* Array Visualization */}
        <div className="space-y-3">
          {/* Horizontal Box View */}
          <div className="flex flex-wrap gap-2">
            {displayArray.map((item, index) => (
              <div
                key={index}
                className={`relative group`}
              >
                {/* Index Label */}
                <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  {index}
                </div>
                {/* Value Box */}
                <div className={`min-w-[60px] px-3 py-2 rounded-lg border-2 text-center font-mono text-sm transition-all ${isDark
                    ? 'bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-800/40 hover:border-blue-600'
                    : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400'
                  }`}>
                  {typeof item === 'object' ? (
                    <span className="text-xs italic">obj</span>
                  ) : (
                    <span className="truncate max-w-[80px] inline-block">
                      {String(item)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {array.length > maxDisplay && (
              <div className={`px-3 py-2 rounded-lg border-2 border-dashed flex items-center ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'
                }`}>
                +{array.length - maxDisplay} more
              </div>
            )}
          </div>

          {/* List View */}
          <div className={`rounded-lg border ${isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
            <div className="max-h-64 overflow-y-auto">
              {displayArray.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-4 py-2 border-b last:border-b-0 font-mono text-sm ${isDark
                      ? 'border-slate-800 hover:bg-slate-800/50'
                      : 'border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <span className={`w-12 text-right ${isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                    [{index}]
                  </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderObjectVisualization = () => {
    const obj = data.data as Record<string, any>;
    const entries = Object.entries(obj);
    const maxDisplay = 20;
    const displayEntries = entries.slice(0, maxDisplay);

    return (
      <div className="space-y-4">
        {/* Metadata */}
        <div className={`flex gap-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
          <span><strong>{t.keys}:</strong> {entries.length}</span>
          {data.metadata?.depth && (
            <span><strong>{t.depth}:</strong> {data.metadata.depth}</span>
          )}
        </div>

        {/* Tree View */}
        <div className={`rounded-lg border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}>
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="space-y-2">
              {displayEntries.map(([key, value], index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 font-mono text-sm`}
                >
                  {/* Connector Line */}
                  <div className="flex flex-col items-center pt-2">
                    <div className={`w-px h-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`} />
                  </div>

                  {/* Key-Value */}
                  <div className="flex-1 pb-2">
                    <div className={`flex items-baseline gap-2 flex-wrap`}>
                      <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'
                        }`}>
                        {key}:
                      </span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        {typeof value === 'object' && value !== null ? (
                          <span className={`italic ${isDark ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                            {Array.isArray(value)
                              ? `Array(${value.length})`
                              : `Object(${Object.keys(value).length})`}
                          </span>
                        ) : typeof value === 'string' ? (
                          <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                            "{value}"
                          </span>
                        ) : typeof value === 'number' ? (
                          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                            {value}
                          </span>
                        ) : (
                          <span className={isDark ? 'text-pink-400' : 'text-pink-600'}>
                            {String(value)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {entries.length > maxDisplay && (
                <div className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  ... {entries.length - maxDisplay} more properties
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full rounded-2xl shadow-2xl transition-all ${isExpanded ? 'max-w-6xl' : 'max-w-3xl'
          } ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
              {t.title}
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
              {data.dataType === 'array' ? t.array : t.object}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-colors ${isDark
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
                }`}
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
                }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {data.dataType === 'array'
            ? renderArrayVisualization()
            : renderObjectVisualization()}
        </div>
      </div>
    </div>
  );
};

export default ExecutionVisualizer;
