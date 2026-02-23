import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const NotificationView = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [notifRes, reqRes] = await Promise.all([
                apiFetch(`/api/notifications/${user.id}`),
                apiFetch(`/api/access-requests/${user.id}`)
            ]);

            if (notifRes.ok) setNotifications(await notifRes.json());
            if (reqRes.ok) setRequests(await reqRes.json());
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [user.id]);

    const handleAction = async (requestId, status) => {
        try {
            const response = await apiFetch(`/api/access-requests/${requestId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                setRequests(requests.filter(r => r.id !== requestId));
            }
        } catch (err) {
            alert("Failed to update request.");
        }
    };

    const markRead = async (id) => {
        try {
            const res = await apiFetch(`/api/notifications/${id}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (e) { }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 fade-in">
            <div className="flex justify-between items-center bg-[#0c111d] p-6 rounded-2xl border border-white/5 shadow-2xl">
                <div>
                    <h2 className="text-2xl font-bold text-white">Signal Center</h2>
                    <p className="text-slate-500 text-sm">Review access requests and system security signals.</p>
                </div>
            </div>

            {/* Access Requests Section */}
            {requests.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] ml-2">Pending Approvals</h3>
                    {requests.map(req => (
                        <div key={req.id} className="bg-[#0c111d] p-6 rounded-2xl border border-blue-500/20 shadow-xl flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Decryption Request for "{req.files?.name}"</h4>
                                    <p className="text-[10px] text-slate-500 font-mono mt-1">Requester Key: {req.requester_key}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleAction(req.id, 'approved')}
                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, 'denied')}
                                    className="px-4 py-2 bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-widest rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                    Deny
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Notifications List */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Recent Signals</h3>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-[#0c111d] p-20 rounded-2xl border border-white/5 text-center shadow-xl">
                        <p className="text-slate-500 italic">No signals detected.</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.isRead && markRead(notification.id)}
                            className={`bg-[#0c111d] p-6 rounded-2xl border border-white/5 shadow-xl transition-all cursor-pointer hover:border-white/10 flex items-start space-x-4 ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className={`p-3 rounded-xl ${notification.type === 'alert' ? 'bg-rose-500/10 text-rose-400' :
                                    notification.type === 'update' ? 'bg-emerald-500/10 text-emerald-400' :
                                        'bg-blue-500/10 text-blue-400'
                                }`}>
                                {notification.type === 'alert' ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                ) : notification.type === 'update' ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-white font-bold">{notification.title}</h4>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm mt-1">{notification.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
};
