
import React, { useState } from 'react';
import { InsightData } from '../types';

interface ResultCardProps {
  label: string; title: string; content: string; insight: InsightData;
  highlight?: boolean; cleanStyle?: boolean; charLimit?: number; onRegenerate?: () => void;
  toneColor?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, title, content, insight, highlight, cleanStyle, charLimit, onRegenerate, toneColor }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sem suporte à Clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHot = toneColor?.includes('orange');

  return (
    <div className={`bg-white rounded-[28px] md:rounded-[40px] border-2 ${copied ? 'border-emerald-400' : 'border-slate-200'} shadow-md hover:shadow-2xl transition-all duration-700 overflow-hidden`}>
      <div className="px-6 md:px-12 py-6 md:py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div className="flex flex-col">
          <span className={`mono text-[9px] md:text-[11px] font-[900] tracking-[0.2em] uppercase ${isHot ? 'text-orange-500' : 'text-[#00e5ff]'}`}>{label}</span>
          <h3 className="text-black font-black text-[10px] md:text-xs uppercase tracking-tight mt-1">{title}</h3>
        </div>
        <div className="flex gap-2 md:gap-3">
          {onRegenerate && (
            <button onClick={onRegenerate} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-black hover:border-black transition-all active:scale-90"><svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
          )}
          <button onClick={handleCopy} className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${copied ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:text-[#00e5ff] hover:border-[#00e5ff] shadow-sm'}`}>
            {copied ? <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> : <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>}
          </button>
        </div>
      </div>
      
      <div className={`p-6 md:p-12 ${cleanStyle ? 'bg-slate-50/20' : ''}`}>
        <p className={`${highlight ? 'text-xl md:text-4xl font-[1000] leading-tight md:leading-[1.1] tracking-tighter text-black' : 'text-base md:text-xl font-medium leading-relaxed text-slate-900'}`}>{content}</p>
        <div className="mt-4 md:mt-6 flex items-center gap-4">
           {charLimit && <span className="mono text-[9px] font-black text-slate-300 uppercase tracking-widest">{content.length} / {charLimit} caracteres</span>}
        </div>
      </div>

      <div className="px-6 md:px-12 py-6 md:py-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4 md:gap-8 items-start">
        <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xl md:text-2xl">💡</div>
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1 md:mb-2">
            <span className={`mono text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase ${isHot ? 'text-orange-400' : 'text-[#00e5ff]'}`}>Insight Neural</span>
            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">{insight.category}</span>
          </div>
          <p className="text-[12px] md:text-[14px] text-slate-800 font-bold leading-relaxed italic">"{insight.text}"</p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
