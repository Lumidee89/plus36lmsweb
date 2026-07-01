export default function StudentIDCard({ user, track }) {
    return (
        /* Increased min-height and vertical padding (py-12) */
        <div className="relative w-full max-w-sm mx-auto min-h-[500px] flex flex-col justify-between overflow-hidden rounded-[3rem] bg-[#1a1d21] p-10 py-12 text-white shadow-2xl border border-white/5">
            
            {/* Background Decorative Elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00d2d3]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header: Logo & Branding */}
                <div className="flex justify-between items-start mb-12">
                    <img src="/logo.png" alt="Plus36" className="h-10 w-auto invert brightness-0" />
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00d2d3]">Student Identity</p>
                        {/* <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Session 2025/26</p> */}
                    </div>
                </div>

                {/* Profile Section - Centered for better vertical flow */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="relative mb-6">
                        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-[#00d2d3] to-teal-600 p-[3px] shadow-2xl">
                            <div className="w-full h-full rounded-[calc(2rem-3px)] bg-[#1a1d21] flex items-center justify-center overflow-hidden">
                                <img
                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a1d21&color=00d2d3&size=128`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-[#00d2d3] p-1.5 rounded-full border-[6px] border-[#1a1d21]">
                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.267 3.455a3.066 3.066 0 001.745-.713 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.713 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.713 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.713 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.713 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.713 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.713-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.713-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="font-black text-2xl leading-tight uppercase tracking-tighter mb-1">{user.name}</h3>
                    <p className="text-xs text-[#00d2d3] font-black uppercase tracking-[0.2em] opacity-80">{user.email}</p>
                </div>

                {/* New Info Section: Fills the vertical space */}
                <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/5 my-6">
                    <div>
                        <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Track</p>
                        {/* THE DYNAMIC PART */}
                        <p className="text-[10px] font-bold text-white uppercase">{track || 'Foundation'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1">Student ID</p>
                        <p className="text-[10px] font-bold text-[#00d2d3] uppercase">P36-{user.id.toString().padStart(4, '0')}</p>
                    </div>
                </div>

                {/* Footer: Tech Stack Aesthetics */}
                <div className="pt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00d2d3] animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                    </div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">Fullstack Mastery Path</p>
                </div>
            </div>
        </div>
    );
};