
import React, { useState } from 'react';
import { optimizeContent } from '../geminiService';
import { OptimizationResult, AppStatus, EditorialTone } from '../types';
import ResultCard from './ResultCard';

const Editor: React.FC = () => {
  const [text, setText] = useState('');
  const [tone, setTone] = useState<EditorialTone>('NEUTRAL');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!text.trim() || text.length < 20) {
      setError('Conteúdo insuficiente para processamento.');
      return;
    }
    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const result = await optimizeContent(text, tone);
      setResults(result);
      setStatus(AppStatus.SUCCESS);
      setTimeout(() => {
        const target = document.getElementById('results-view');
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 120,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (err) {
      setError('Falha no motor editorial.');
      setStatus(AppStatus.ERROR);
    }
  };

  const toneConfig = {
    COLD: { color: 'border-[#00e5ff]', label: 'Frio / Analítico', shadow: 'shadow-[0_20px_40px_rgba(0,229,255,0.1)]' },
    NEUTRAL: { color: 'border-[#00e5ff]', label: 'Equilibrado / SEO', shadow: 'shadow-[0_20px_40px_rgba(0,229,255,0.1)]' },
    HOT: { color: 'border-[#f97316]', label: 'Quente / Viral', shadow: 'shadow-[0_20px_40px_rgba(249,115,22,0.1)]' }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
      {/* 1. CAIXA DE TEXTO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 md:px-4">
           <h2 className="text-[10px] md:text-xs font-black tracking-widest uppercase text-slate-400">Conteúdo da Matéria</h2>
           <span className="mono text-[9px] font-black text-slate-200 uppercase tracking-widest italic hidden sm:block">Input_Buffer</span>
        </div>

        <div className={`dynamic-border ${toneConfig[tone].color} bg-white rounded-[24px] md:rounded-[32px] ${toneConfig[tone].shadow} border-2 border-slate-200 overflow-hidden min-h-[350px] md:min-h-[450px] flex flex-col transition-all duration-700`}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole o rascunho da matéria aqui..."
            className="flex-grow p-6 md:p-12 text-lg md:text-xl text-black leading-relaxed placeholder:text-slate-100 resize-none font-medium outline-none bg-transparent"
          />
          <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 md:px-12">
            <div className="flex flex-col items-center md:items-start">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mono">Métrica_Texto</span>
               <span className="text-sm font-black text-black">{text.length} caracteres</span>
            </div>
            <button
              onClick={handleOptimize}
              disabled={status === AppStatus.LOADING || !text.trim()}
              className="w-full md:w-auto h-14 px-10 rounded-2xl bg-black text-white font-black text-[11px] tracking-widest uppercase hover:bg-slate-900 transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-4 shadow-xl"
            >
              {status === AppStatus.LOADING ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Otimizar Agora"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. REATOR DE IMPACTO */}
      <div className={`dynamic-border ${toneConfig[tone].color} bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-sm border-2 border-slate-200 space-y-8 transition-all duration-700`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-[1000] tracking-tighter uppercase">Calibragem Editorial</h3>
            <p className="mono text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">editorial_xp engine</p>
          </div>
          <div className={`px-5 py-2 rounded-xl border-2 ${toneConfig[tone].color} bg-white shadow-sm`}>
             <span className={`text-[10px] font-black uppercase tracking-widest ${tone === 'HOT' ? 'text-orange-500' : 'text-[#00e5ff]'}`}>
               MODO: {toneConfig[tone].label}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <span className="text-xl md:text-2xl opacity-40">❄️</span>
          <div className="flex-grow relative pt-2">
            <input 
              type="range" min="0" max="2" step="1"
              value={tone === 'COLD' ? 0 : tone === 'NEUTRAL' ? 1 : 2}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTone(val === 0 ? 'COLD' : val === 1 ? 'NEUTRAL' : 'HOT');
              }}
              className="reator-slider"
            />
            <div className="flex justify-between mt-5 px-1">
               <span className={`text-[9px] md:text-[10px] font-black mono uppercase tracking-tighter ${tone === 'COLD' ? 'text-cyan-500' : 'text-slate-200'}`}>Analítico</span>
               <span className={`text-[9px] md:text-[10px] font-black mono uppercase tracking-tighter ${tone === 'NEUTRAL' ? 'text-cyan-500' : 'text-slate-200'}`}>Padrão</span>
               <span className={`text-[9px] md:text-[10px] font-black mono uppercase tracking-tighter ${tone === 'HOT' ? 'text-orange-500' : 'text-slate-200'}`}>Viral</span>
            </div>
          </div>
          <span className="text-xl md:text-2xl opacity-40">🔥</span>
        </div>
      </div>

      {error && <div className="p-4 text-center bg-red-50 text-red-600 rounded-2xl font-bold text-[10px] uppercase mono border border-red-100">{error}</div>}

      {/* 3. RESULTADOS */}
      {status === AppStatus.SUCCESS && results && (
        <div id="results-view" className="space-y-8 md:space-y-12 pt-10 md:pt-16 pb-24 animate-fade-up scroll-mt-32">
          <div className="flex items-center gap-4 px-2">
            <div className="h-[3px] w-8 md:w-12 bg-[#00e5ff] rounded-full"></div>
            <h2 className="text-black font-[1000] text-2xl md:text-4xl tracking-tighter uppercase">Relatório Lab</h2>
          </div>

          <div className="grid gap-6 md:gap-10">
            <ResultCard label="HEADLINE // Título" title="Sugestão Principal" content={results.titulo} insight={results.tituloInsight} highlight={true} charLimit={80} onRegenerate={handleOptimize} toneColor={toneConfig[tone].color.replace('border-', 'text-')} />
            <ResultCard label="SUB // Linha Fina" title="Contextualização SEO" content={results.linhaFina} insight={results.linhaFinaInsight} />
            <ResultCard label="LEAD // Primeiro Parágrafo" title="Reestruturação de Lide" content={results.primeiroParagrafo} insight={results.primeiroParagrafoInsight} cleanStyle={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
