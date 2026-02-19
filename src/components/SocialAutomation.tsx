import React, { useState } from 'react';
import { AutoDashboard } from './AutoDashboard';
import { PostsTable } from './PostsTable';
import { SocialConfig } from './SocialConfig';
import { LogsPanel } from './LogsPanel';

type Tab = 'dashboard' | 'posts' | 'config' | 'logs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'posts', label: 'Posts' },
  { id: 'logs', label: 'Logs' },
  { id: 'config', label: 'Config' },
];

export const SocialAutomation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-slate-100 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs mono uppercase tracking-widest font-bold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'dashboard' && <AutoDashboard />}
        {activeTab === 'posts' && <PostsTable />}
        {activeTab === 'logs' && <LogsPanel />}
        {activeTab === 'config' && <SocialConfig />}
      </div>
    </div>
  );
};
