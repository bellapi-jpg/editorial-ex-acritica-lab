import React from 'react';
import type { Post } from '../types';

interface StatusBadgeProps {
  status: Post['status'];
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<Post['status'], { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  partial: {
    label: 'Parcial',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  completed: {
    label: 'Publicado',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded font-semibold uppercase tracking-wider mono ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
};

interface PlatformBadgeProps {
  platform: 'twitter' | 'facebook';
  posted: boolean;
  error?: string | null;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, posted, error }) => {
  const label = platform === 'twitter' ? 'X' : 'FB';
  const title = platform === 'twitter' ? 'Twitter/X' : 'Facebook';

  if (posted) {
    return (
      <span title={`${title}: publicado`} className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold mono">
        {label}
      </span>
    );
  }

  if (error) {
    return (
      <span title={`${title}: ${error}`} className="inline-flex items-center justify-center w-7 h-7 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold mono cursor-help">
        {label}
      </span>
    );
  }

  return (
    <span title={`${title}: pendente`} className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-bold mono">
      {label}
    </span>
  );
};
