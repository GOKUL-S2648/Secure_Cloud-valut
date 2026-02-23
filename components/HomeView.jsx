import React, { useState, useEffect } from 'react';
import { formatBytes, generateDynamicKey } from '../constants';
import { groqService } from '../services/groqService';
import { apiFetch } from '../services/api';
import { encryptFile, decryptFile, bufferToBase64, base64ToBuffer } from '../services/encryption';

export const HomeView = ({ user }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(null);

  useEffect(() => {
    apiFetch(`/api/files/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFiles(data);
        } else {
          console.error('Expected array from /api/files, got:', data);
          setFiles([]);
        }
      });
  }, [user.id]);

  const saveFiles = async (newFiles) => {
    setFiles(newFiles);
    await apiFetch(`/api/files/${user.id}`, {
      method: 'POST',
      body: JSON.stringify(newFiles)
    });
  };

  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    const uploadedFiles = [];
    const currentKey = generateDynamicKey(user.id, user.session_salt);

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];

      // 1. AI Analysis (on raw metadata)
      const analysis = await groqService.analyzeFile(f.name, f.type);

      // 2. Encryption (on content)
      const { cipherText, iv } = await encryptFile(f, currentKey);

      const fileData = {
        id: Math.random().toString(36).substr(2, 9),
        ownerId: user.id,
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(f), // Local preview
        isPublic: true,
        category: analysis.category,
        riskLevel: analysis.riskLevel,
        verdict: analysis.verdict,
        cipherContent: bufferToBase64(cipherText),
        iv: bufferToBase64(iv)
      };
      uploadedFiles.push(fileData);
    }

    saveFiles([...files, ...uploadedFiles]);
    setIsUploading(false);
  };

  const handleSecureDownload = async (file) => {
    if (!file.cipherContent || !file.iv) {
      alert("This file was not uploaded using the secure encryption protocol.");
      return;
    }

    setIsDecrypting(file.id);
    const activeKey = generateDynamicKey(user.id);

    try {
      const cipherBuffer = base64ToBuffer(file.cipherContent);
      const ivBuffer = base64ToBuffer(file.iv);

      const decryptedBlob = await decryptFile(cipherBuffer, ivBuffer, activeKey, file.type);
      const url = window.URL.createObjectURL(decryptedBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `DECRYPTED_${file.name}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Decryption failed:', err);
      alert("Decryption failed. Your Master Key may have changed since this file was uploaded.");
    } finally {
      setIsDecrypting(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(`/api/files/${user.id}/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFiles(files.filter(f => f.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Delete failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Connection error during deletion.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in">
      {/* Upload Section */}
      <section className="bg-[#0c111d] p-10 rounded-2xl border-2 border-dashed border-white/5 hover:border-blue-500/50 transition-all group text-center shadow-2xl">
        <div className="mx-auto h-16 w-16 text-slate-700 group-hover:text-blue-500/80 transition-all mb-6 group-hover:scale-110">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          Ingest Resources
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-black tracking-widest uppercase">Auto-Encrypt active</span>
        </h2>
        <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">Drop your encrypted volumes or media files to sync them with your secure vault. All files are encrypted client-side using 256-bit AES-GCM before upload.</p>
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload-main"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload-main"
          className={`inline-flex items-center px-10 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer transition-all shadow-xl ${isUploading ? 'bg-slate-700 opacity-50' : 'bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 shadow-blue-900/40'}`}
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Processing...
            </div>
          ) : 'Select Resources'}
        </label>
      </section>

      {/* Resource List */}
      <section className="bg-[#0c111d] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white tracking-tight">Vault Inventory</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{files.length} ITEMS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/2">
                <th className="px-8 py-4">Resource</th>
                <th className="px-8 py-4">Size</th>
                <th className="px-8 py-4">Security Verdict</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-600 text-sm italic">
                    Vault is currently unpopulated.
                  </td>
                </tr>
              ) : (
                files.map(file => (
                  <tr key={file.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-8 py-5 text-sm font-medium text-slate-300">
                      <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-[#1a1f2e] text-blue-400 rounded-lg group-hover:scale-110 transition-transform shadow-lg border border-white/5">
                          {file.type.includes('video') ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{file.name}</span>
                          <span className="text-[10px] font-bold text-emerald-400/80 flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                            AES-256 GCM Protected
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-semibold text-slate-500">
                      <span className="bg-white/5 px-2.5 py-1 rounded-lg">{formatBytes(file.size)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${file.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            file.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                            {file.riskLevel || 'Analyzing...'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                            {file.category || 'Pending'}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 italic max-w-xs truncate">
                          {file.verdict || 'Processing security signals...'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.open(file.url)}
                          title="View local preview"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all border border-blue-500/20 hover:border-blue-500/40 shadow-lg shadow-black/20"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">View</span>
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          title="Delete permanently"
                          className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/20 hover:border-rose-500/40 shadow-lg shadow-black/20"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};