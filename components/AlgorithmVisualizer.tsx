'use client';

import React, { useState } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

interface AlgorithmStep {
  step: number;
  description: string;
  variables: Record<string, any>;
  highlightIndices?: number[];
  arrays?: {
    name: string;
    values: any[];
    highlights?: number[];
  }[];
}

interface AlgorithmVisualizerProps {
  steps: AlgorithmStep[];
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  lang: 'pt' | 'en';
}

const translations = {
  pt: {
    title: 'Visualização de Algoritmo',
    step: 'Passo',
    of: 'de',
    variables: 'Variáveis',
    play: 'Executar',
    pause: 'Pausar',
    next: 'Próximo',
    prev: 'Anterior',
    reset: 'Reiniciar',
    speed: 'Velocidade',
  },
  en: {
    title: 'Algorithm Visualization',
    step: 'Step',
    of: 'of',
    variables: 'Variables',
    play: 'Play',
    pause: 'Pause',
    next: 'Next',
    prev: 'Previous',
    reset: 'Reset',
    speed: 'Speed',
  }
};

const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({
  steps,
  isOpen,
  onClose,
  theme,
  lang
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms between steps

  const isDark = theme === 'dark';
  const t = translations[lang];

  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, steps.length]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
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
              {t.step} {currentStep + 1} {t.of} {steps.length}
            </p>
          </div>
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Step Description */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
            }`}>
            <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'
              }`}>
              {step.description}
            </p>
          </div>

          {/* Arrays Visualization */}
          {step.arrays && step.arrays.map((arr, idx) => (
            <div key={idx} className="space-y-6">
              <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                {arr.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {arr.values.map((value, index) => {
                  const isHighlighted = arr.highlights?.includes(index);
                  return (
                    <div key={index} className="relative">
                      {/* Index label */}
                      <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                        {index}
                      </div>
                      {/* Value box */}
                      <div className={`min-w-[60px] px-3 py-2 rounded-lg border-2 text-center font-mono text-sm transition-all ${isHighlighted
                        ? isDark
                          ? 'bg-yellow-900/40 border-yellow-600 text-yellow-300 scale-110'
                          : 'bg-yellow-100 border-yellow-400 text-yellow-900 scale-110'
                        : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Variables Table */}
          <div>
            <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
              {t.variables}
            </h4>
            <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
              {step.variables && Object.entries(step.variables).map(([key, value], idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 px-4 py-2 border-b last:border-b-0 ${isDark
                    ? 'border-slate-800 bg-slate-900/50'
                    : 'border-slate-200 bg-slate-50'
                    }`}
                >
                  <span className={`font-mono font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'
                    }`}>
                    {key}:
                  </span>
                  <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`p-2 rounded-lg transition-colors ${isDark
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-200 text-slate-600'
                }`}
              title={t.reset}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDark
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-200 text-slate-600'
                }`}
              title={t.prev}
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg transition-colors ${isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              title={isPlaying ? t.pause : t.play}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
              className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDark
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-200 text-slate-600'
                }`}
              title={t.next}
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-3">
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
              {t.speed}:
            </span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className={`px-3 py-1 rounded-lg border text-sm ${isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-white border-slate-300 text-slate-700'
                }`}
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={250}>4x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmVisualizer;
