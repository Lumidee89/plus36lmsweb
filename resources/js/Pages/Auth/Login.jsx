import { useForm, Link, Head } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfcfd] p-6 relative overflow-hidden">
            <Head title="Login | Plus36 Academy" />

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#1a1d21 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="w-full max-w-4xl grid lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 relative z-10">
                
                {/* Left Side: Brand Context */}
                <div className="bg-[#1a1d21] p-12 text-white flex flex-col justify-between">
                    <div>
                        <Link href="/" className="flex items-center">
                            <img 
                                src="/log.png" 
                                alt="Plus36 Academy" 
                                className="h-16 w-auto object-contain hover:opacity-80 transition-opacity" 
                            />
                        </Link>
                        <h2 className="text-5xl font-black tracking-tighter leading-[0.9] mb-6">Master the <br/><span className="text-[#00d2d3]">Digital Craft.</span></h2>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">Log in to access your dashboard, continue your courses, and engage with the community.</p>
                    </div>
                    
                    <div className="pt-8 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Your Faculty head's await your arrival.</p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-12 bg-white">
                    <div className="mb-10">
                        {/* <span className="text-[#00d2d3] font-black text-[10px] tracking-widest uppercase">Security Check</span> */}
                        <h2 className="text-3xl font-black text-[#1a1d21] tracking-tighter mt-2">Welcome Back.</h2>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
                            <input 
                                type="email" 
                                value={data.email}
                                placeholder="name@example.com"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00d2d3] focus:bg-white transition-all outline-none" 
                                onChange={e => setData('email', e.target.value)} 
                                required
                            />
                            {errors.email && <p className="text-red-500 text-[9px] font-black mt-1 uppercase tracking-widest">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Password</label>
                            <input 
                                type="password" 
                                value={data.password}
                                placeholder="••••••••"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00d2d3] focus:bg-white transition-all outline-none" 
                                onChange={e => setData('password', e.target.value)} 
                                required
                            />
                            {errors.password && <p className="text-red-500 text-[9px] font-black mt-1 uppercase tracking-widest">{errors.password}</p>}
                        </div>

                        <button 
                            disabled={processing} 
                            className="w-full py-5 bg-[#1a1d21] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all duration-500 shadow-xl shadow-gray-100"
                        >
                            Authorize Session
                        </button>

                        <div className="text-center pt-6">
                            <Link href="/register" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#00d2d3] transition-colors">
                                No account? <span className="text-[#1a1d21]">Join the Circle</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}