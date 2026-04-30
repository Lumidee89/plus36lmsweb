import { useForm, Link, Head } from '@inertiajs/react';

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