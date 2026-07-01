import { useForm, Link, Head } from '@inertiajs/react';

function GoogleIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
    );
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'student',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfcfd] p-6 relative overflow-hidden">
            <Head title="Join Plus36 Academy" />

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#1a1d21 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="w-full max-w-4xl grid lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 relative z-10">
                
                {/* Left Side: Aesthetic Context */}
                <div className="bg-[#1a1d21] p-12 text-white flex flex-col justify-between">
                    <div>
                        <Link href="/" className="flex items-center">
                            <img 
                                src="/log.png" 
                                alt="Plus36 Academy" 
                                className="h-16 w-auto object-contain hover:opacity-80 transition-opacity" 
                            />
                        </Link>
                        <h2 className="text-5xl font-black tracking-tighter leading-[0.9] mb-6">Create Your <br/><span className="text-[#00d2d3]">Account.</span></h2>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">Start your journey toward mastering high-income skills and digital leadership.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-[#00d2d3]"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry-Vetted Curriculum</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-[#00d2d3]"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Professional Networking</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-12 bg-white">
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                                There was an issue creating your account. Please check the fields below.
                            </p>
                        </div>
                    )}

                    <a
                        href="/auth/google/redirect"
                        className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-xs font-black uppercase tracking-widest text-[#1a1d21] shadow-sm transition-all hover:border-[#00d2d3] hover:bg-gray-50"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </a>

                    <div className="mb-5 flex items-center gap-4">
                        <span className="h-px flex-1 bg-gray-100"></span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">or</span>
                        <span className="h-px flex-1 bg-gray-100"></span>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="John Doe"
                                    value={data.name}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00d2d3] outline-none transition-all" 
                                    onChange={e => setData('name', e.target.value)} 
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-[9px] font-black mt-1 uppercase tracking-widest">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="name@example.com"
                                    value={data.email}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00d2d3] outline-none transition-all" 
                                    onChange={e => setData('email', e.target.value)} 
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-[9px] font-black mt-1 uppercase tracking-widest">{errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Password</label>
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                value={data.password}
                                className={`w-full p-4 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-100'} rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00d2d3] outline-none transition-all`} 
                                onChange={e => setData('password', e.target.value)} 
                                required
                            />
                            {/* Dynamic Error Message */}
                            {errors.password ? (
                                <p className="text-red-500 text-[9px] font-black mt-1 uppercase tracking-widest">{errors.password}</p>
                            ) : (
                                <p className="text-[8px] text-gray-400 mt-2 uppercase tracking-widest font-black">Min. 8 characters</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">I want to join as a...</label>
                            <div className="relative">
                                <select 
                                    name="role" 
                                    value={data.role}
                                    onChange={e => setData('role', e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00d2d3] outline-none appearance-none cursor-pointer"
                                >
                                    <option value="student">Student (I want to learn)</option>
                                    <option value="tutor">Tutor (I want to teach)</option>
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={processing} 
                            className="w-full py-5 bg-[#1a1d21] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all duration-500 mt-4 shadow-xl shadow-gray-100"
                        >
                            Get Started Now
                        </button>

                        <div className="text-center pt-4">
                            <Link href="/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#00d2d3] transition-colors">
                                Have an account? <span className="text-[#1a1d21]">Sign In</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
