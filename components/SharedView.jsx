import React, { useState, useEffect } from 'react';
import { formatBytes } from '../constants';

export const SharedView = ({ user }) => {
  const [targetKey, setTargetKey] = useState('');
  const [sharedFiles, setSharedFiles] = useState(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Clear error when user starts typing again
  useEffect(() => {
    if (error) setError('');
  }, [targetKey]);

  const handleAccess = async () => {
    if (!targetKey.trim()) {
      setError('Please enter a valid key.');
      return;
    }

    setIsSearching(true);
    setError('');
    setSharedFiles(null);

    try {
      const response = await fetch(`/api/shared-files/${targetKey}`);
      const data = await response.json();

      if (response.ok) {
        setSharedFiles(data.files);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed. Please ensure the backend is running.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#0c111d] p-10 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-center space-x-6 mb-10 relative z-10">
          <div className="h-14 w-14 bg-blue-600/10 text-[#3b82f6] rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Access Shared Vault</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Remote vault access requires a temporary 8-character session key.</p>
          </div>
        </div>

        <div className="relative group z-10">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="PASTE KEY HERE (E.G. A1B2C3D4)"
                className="w-full px-6 py-4 bg-[#1a1f2e] border border-white/10 rounded-2xl font-mono text-lg uppercase text-white placeholder-slate-600 focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-[#3b82f6]/50 outline-none transition-all shadow-inner"
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
              />
            </div>
            <button
              onClick={handleAccess}
              disabled={isSearching}
              className="px-10 py-4 bg-[#2563eb] text-white rounded-2xl font-bold hover:bg-[#1d4ed8] active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center min-w-[160px]"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Accessing...
                </div>
              ) : 'Open Vault'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 flex items-center p-5 bg-rose-500/5 text-rose-400 rounded-2xl border border-rose-500/20 text-sm font-medium animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {sharedFiles && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-[#0c111d] rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Remote Repository</h3>
                <p className="text-xs text-slate-500 font-medium">Session Established // Decrypted Output</p>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Connected</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-500 tracking-widest bg-white/2">
                    <th className="px-8 py-4 font-bold">Resource</th>
                    <th className="px-8 py-4 font-bold">Size</th>
                    <th className="px-8 py-4 font-bold text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sharedFiles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center text-slate-600 text-sm italic">
                        This vault is currently empty.
                      </td>
                    </tr>
                  ) : (
                    sharedFiles.map(file => (
                      <tr key={file.id} className="hover:bg-white/2 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-[#1a1f2e] text-blue-400 rounded-xl group-hover:scale-110 transition-transform shadow-lg border border-white/5">
                              {file.type.includes('video') ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-white block text-sm">{file.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{file.type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-semibold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{formatBytes(file.size)}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600/10 text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 group-hover:shadow-lg"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download
                          </button>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
