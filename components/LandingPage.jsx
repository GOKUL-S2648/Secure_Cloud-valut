import React from 'react';

export const LandingPage = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen flex flex-col bg-[#050505] text-white fade-in">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto z-10">
                <span className="text-xl font-bold tracking-tight text-white">SecureCloud</span>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
                    Ultimate Privacy, <br />
                    Unbreakable Security.
                </h1>
                <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
                    SecureCloud uses end-to-end encryption to ensure your files are for your eyes only.
                    Not even we can see them. Upload, manage, and share with absolute peace of mind.
                </p>

                <button
                    onClick={onGetStarted}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-95 mb-20"
                >
                    Get Started
                </button>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full mb-16 px-4">
                    {[
                        {
                            title: 'End-to-End Encrypted',
                            desc: "Every file is encrypted in your browser before it's uploaded. Only you hold the key.",
                            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                        },
                        {
                            title: 'Seamless Uploads',
                            desc: 'Drag and drop any file type. Our system handles the rest, securing your data in the cloud.',
                            icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                        },
                        {
                            title: 'Secure Sharing',
                            desc: 'Share files with anyone using your master key, or generate secure, one-time links.',
                            icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                        }
                    ].map((f, i) => (
                        <div key={i} className="bg-[#0c111d] border border-white/5 p-10 rounded-2xl text-center hover:border-white/10 transition-colors group">
                            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[#2563eb] group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
