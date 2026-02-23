import React, { useState, useEffect } from 'react';
import { generateDynamicKey } from '../constants';
import { HomeView } from './HomeView';
import { SharedView } from './SharedView';
import { NotificationView } from './NotificationView';

export const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('my-files');
  const [accessKey, setAccessKey] = useState('');

  useEffect(() => {
    setAccessKey(generateDynamicKey(user.id, user.session_salt));
    const interval = setInterval(() => {
      setAccessKey(generateDynamicKey(user.id, user.session_salt));
    }, 1000 * 60 * 60); // Check every hour
    return () => clearInterval(interval);
  }, [user.id, user.session_salt]);

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden fade-in text-slate-300">
      {/* Sidebar */}
      <aside className="w-68 bg-[#0c111d] border-r border-white/5 flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-10 group cursor-pointer">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 text-white transition-transform group-hover:scale-105">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SecureCloud</span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('my-files')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all border border-transparent ${activeTab === 'my-files' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-semibold text-sm">My Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all border border-transparent ${activeTab === 'shared' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-semibold text-sm">Shared Files</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all border border-transparent ${activeTab === 'notifications' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-semibold text-sm">Notifications</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
              <img src={`https://picsum.photos/seed/${user.id}/40/40`} alt="Avatar" className="opacity-80" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Member</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 text-xs font-bold text-slate-500 hover:text-rose-400 border border-white/5 rounded-xl hover:bg-rose-500/5 transition-all text-center tracking-widest"
          >
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="grid-bg"></div>
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between z-10">
          <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === 'my-files' ? 'Inventory' : activeTab === 'shared' ? 'Shared Port' : 'Signals'}
          </h1>
          <div className="flex items-center">
            <div className="flex items-center space-x-3 bg-[#0c111d] px-4 py-2 rounded-xl border border-white/10 text-xs shadow-xl shadow-black/20">
              <span className="font-bold text-slate-500 uppercase tracking-widest">Key:</span>
              <span className="font-mono font-bold text-blue-400">{accessKey}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
          {activeTab === 'my-files' && <HomeView user={user} />}
          {activeTab === 'shared' && <SharedView user={user} />}
          {activeTab === 'notifications' && <NotificationView user={user} />}
        </div>
      </main>
    </div>
  );
};