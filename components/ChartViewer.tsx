'use client';

import React, { useState } from 'react';
import { Maximize2, Download, X } from 'lucide-react';

interface ChartViewerProps {
  data: string; // base64 image or HTML
  chartType: 'matplotlib' | 'plotly' | 'image';
  theme: 'light' | 'dark';
}

const ChartViewer: React.FC<ChartViewerProps> = ({ data, chartType, theme }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'dark';

  const handleDownload = () => {
    if (chartType === 'matplotlib' || chartType === 'image') {
      // Download base64 image
      const a = document.createElement('a');
      a.href = data;
      a.download = `chart-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <>
      <div className={`relative rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
        {/* Chart Controls */}
        <div className={`absolute top-2 right-2 z-10 flex gap-2`}>
          {(chartType === 'matplotlib' || chartType === 'image') && (
            <button
              onClick={handleDownload}
              className={`p-2 rounded-md backdrop-blur-sm transition-colors cursor-pointer ${isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                : 'bg-white/80 hover:bg-slate-50 text-slate-700 border border-slate-300'
                }`}
              title="Download"
            >
              <Download size={16} />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(true)}
            className={`p-2 rounded-md backdrop-blur-sm transition-colors cursor-pointer ${isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              : 'bg-white/80 hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Chart Content */}
        <div className="p-4">
          {chartType === 'matplotlib' || chartType === 'image' ? (
            <img
              src={data}
              alt="Chart"
              className="max-w-full h-auto mx-auto"
              style={{ maxHeight: '500px' }}
            />
          ) : chartType === 'plotly' ? (
            <div
              dangerouslySetInnerHTML={{ __html: data }}
              className="w-full"
            />
          ) : null}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div
            className="max-w-full max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {chartType === 'matplotlib' || chartType === 'image' ? (
              <img
                src={data}
                alt="Chart"
                className="max-w-full h-auto"
              />
            ) : chartType === 'plotly' ? (
              <div
                dangerouslySetInnerHTML={{ __html: data }}
                className="bg-white rounded-lg"
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default ChartViewer;
