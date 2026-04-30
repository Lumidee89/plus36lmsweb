import { Link, Head, usePage } from '@inertiajs/react';

export default function Home({ totalEnrolled, featuredCourses, faculties }) {
    const { auth } = usePage().props;
    return (
        <div className="min-h-screen bg-[#fbfcfd] text-[#1a1d21] font-sans selection:bg-[#00d2d3] selection:text-black">
            <Head title="Plus36 Academy | Master the Digital Craft" />
            
            {/* Navigation */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 bg-[#fbfcfd]/80 backdrop-blur-md z-50">
                <Link href="/" className="flex items-center">
                    <img 
                        src="/logo.png" 
                        alt="Plus36 Academy" 
                        className="h-16 w-auto object-contain hover:opacity-80 transition-opacity" 
                    />
                </Link>

                <div className="hidden md:flex items-center">
                    {auth.user ? (
                        /* Authenticated State */
                        <Link href={route('dashboard')} className="flex items-center space-x-4 group bg-white p-1.5 pr-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-[#1a1d21] overflow-hidden">
                                <img 
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${auth.user.name}&backgroundColor=1a1d21&fontFamily=Arial&bold=true`} 
                                    alt={auth.user.name} 
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1d21]">Welcome back,</span>
                                <span className="text-xs font-bold text-gray-500 group-hover:text-[#00d2d3] transition-colors">{auth.user.name}</span>
                            </div>
                        </Link>
                    ) : (
                        /* Guest State */
                        <div className="flex space-x-8 text-[10px] font-black uppercase tracking-widest items-center">
                            <Link href={route('login')} className="hover:text-[#00d2d3] transition-colors">Login</Link>
                            <Link href={route('register')} className="bg-[#1a1d21] text-white px-8 py-4 rounded-2xl hover:bg-[#00d2d3] hover:text-black transition-all duration-500 shadow-xl shadow-gray-200">
                                Join the Circle
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Modern Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                {/* Hero Content */}
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7">
                            {/* ... labels and headlines ... */}
                            <h1 className="text-7xl md:text-8xl font-black text-[#1a1d21] leading-[0.95] tracking-tighter mb-8">
                                Master the <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2d3] to-teal-600">Digital Craft.</span>
                            </h1>
                            <p class="text-gray-500 text-xl leading-relaxed mb-12 max-w-xl">
                                High-impact technical education for the next generation of software engineers and founders.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                                {/* Dynamic Hero Button: Go to Dashboard if logged in, else Register */}
                                <Link 
                                    href={auth.user ? route('dashboard') : route('register')} 
                                    className="w-full sm:w-auto bg-[#1a1d21] text-white px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all duration-500 shadow-2xl shadow-gray-200 text-center"
                                >
                                    {auth.user ? 'Go to Dashboard' : 'Start Learning Now'}
                                </Link>
                                
                                <div className="flex items-center space-x-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-100">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}&mask=true`} alt="Student" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-400">Join {totalEnrolled.toLocaleString()}+ Students</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative">
                            <div className="relative bg-white p-4 rounded-[3rem] shadow-2xl rotate-2">
                                <div className="rounded-[2.5rem] overflow-hidden aspect-[4/5] bg-gray-100">
                                    <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" 
                                         className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Technical Workshop" />
                                </div>
                                
                                {/* Floating Enrollment Card */}
                                <div className="absolute -bottom-10 -left-10 bg-[#1a1d21] p-8 rounded-[2rem] shadow-2xl -rotate-2 border border-white/10">
                                    <p className="text-[#00d2d3] text-5xl font-black mb-1 tracking-tighter italic">
                                        {/* {(totalEnrolled / 1000).toFixed(1)}K */}
                                        1,120k
                                    </p>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em]">Live Global Reach</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Faculty Bento Grid */}
            <section className="py-24 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-[#1a1d21] tracking-tighter">Top Faculties.</h2>
                            <p className="text-gray-400 mt-2">Specialized tracks designed for professional scale.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* 2. Map through real data instead of dummy array */}
                        {faculties && faculties.length > 0 ? (
                            faculties.map((faculty) => (
                                <div key={faculty.id} className="group bg-[#f8f9fb] p-10 rounded-[2.5rem] hover:bg-[#1a1d21] transition-all duration-500 cursor-pointer">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1a1d21] shadow-sm group-hover:bg-[#00d2d3] transition-colors mb-8">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                        </svg>
                                    </div>
                                    <span className="font-black text-[#1a1d21] group-hover:text-white transition-colors uppercase text-[10px] tracking-[0.2em]">
                                        {faculty.name}
                                    </span>
                                </div>
                            ))
                        ) : (
                            /* 3. Empty State Fallback */
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No faculties onboarded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Course Curriculum Grid */}
            <section className="py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-[#1a1d21] tracking-tighter">The Curriculum.</h2>
                            <p className="text-gray-400 mt-2">Built by engineers, for engineers. Every module is project-based.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {featuredCourses.length > 0 ? (
                            featuredCourses.map((course, i) => (
                                <div key={course.id} className="group">
                                    <div className="relative rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl h-80 bg-gray-100">
                                        <div className="absolute inset-0 bg-[#1a1d21]/10 group-hover:bg-transparent transition-colors z-10"></div>
                                        {/* Use a placeholder if no image exists in your DB yet */}
                                        <img 
                                            src={`https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&sig=${course.id}`} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                            alt={course.name} 
                                        />
                                        <div className="absolute top-6 left-6 z-20">
                                            <span className="bg-white/90 backdrop-blur-md text-black text-[9px] font-black px-5 py-2 rounded-full uppercase tracking-widest">
                                                {course.level || 'Professional'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-4">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-6 h-6 rounded-full bg-[#00d2d3]"></div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {course.user?.name || 'Plus36 Original'}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1a1d21] mb-6 group-hover:text-[#00d2d3] transition-colors tracking-tighter leading-tight">
                                            {course.title}
                                        </h3>
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                                            <span className="text-2xl font-black">
                                                ₦{course.price || '29.00'}
                                            </span>
                                            <Link 
                                                href={route('register', { course: course.id })} 
                                                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#1a1d21] hover:text-white transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Our curriculum is being updated. Check back soon!</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Dark Mode Statistics */}
            <section className="py-32 bg-[#1a1d21] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10 text-center md:text-left">
                    <div className="space-y-4">
                        <p className="text-[#00d2d3] text-7xl font-black tracking-tighter italic">{totalEnrolled.toLocaleString()}</p>
                        <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.4em]">Active Students</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[#00d2d3] text-7xl font-black tracking-tighter italic">115+</p>
                        <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.4em]">Web Projects</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[#00d2d3] text-7xl font-black tracking-tighter italic">18+</p>
                        <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.4em]">Mobile Apps</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[#00d2d3] text-7xl font-black tracking-tighter italic">24/7</p>
                        <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.4em]">Direct Mentorship</p>
                    </div>
                </div>
            </section>

            {/* Success Stories */}
            <section className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <h2 className="text-6xl font-black text-[#1a1d21] tracking-tighter mb-12 leading-[0.9]">
                                Verified by <br /> <span className="text-[#00d2d3]">the Industry.</span>
                            </h2>
                            <div className="space-y-16">
                                {['Developer Alpha', 'Founder Beta'].map((name) => (
                                    <div key={name} className="relative pl-12 border-l-2 border-[#00d2d3]/20">
                                        <p className="text-xl text-gray-500 italic mb-8 leading-relaxed">
                                            "The transition from Laravel enthusiast to full-stack architect was seamless thanks to the structured path at Plus36 Academy."
                                        </p>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shadow-inner">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&mask=true`} alt={name} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-tighter">{name}</h4>
                                                <p className="text-[10px] font-black text-[#00d2d3] uppercase tracking-[0.2em]">Verified Alumni</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="hidden lg:grid grid-cols-2 gap-6 pt-12">
                            <div className="space-y-6">
                                <div className="h-80 bg-gray-50 rounded-[3rem] overflow-hidden shadow-xl"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-80" alt="Work" /></div>
                                <div className="h-48 bg-[#00d2d3] rounded-[3rem] shadow-xl shadow-[#00d2d3]/10"></div>
                            </div>
                            <div className="space-y-6 pt-12">
                                <div className="h-48 bg-[#1a1d21] rounded-[3rem] shadow-2xl"></div>
                                <div className="h-80 bg-gray-50 rounded-[3rem] overflow-hidden shadow-xl"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-80" alt="Collaboration" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#1a1d21] pt-32 pb-12 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-12 gap-20 mb-24">
                        <div className="lg:col-span-6">
                            <Link href="/" className="flex items-center">
                                <img 
                                    src="/logo.png" 
                                    alt="Plus36 Academy" 
                                    className="h-16 w-auto object-contain hover:opacity-80 transition-opacity" 
                                />
                            </Link>
                            <p className="text-gray-500 text-xl leading-relaxed max-w-md">
                                Empowering software engineers to lead technical teams and build the future of the digital economy.
                            </p>
                        </div>
                        <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-12">
                            <div>
                                <h4 className="font-black mb-10 text-[#00d2d3] uppercase text-[10px] tracking-[0.4em]">Curriculum</h4>
                                <ul className="space-y-5 text-sm text-gray-500 font-bold tracking-tight">
                                    <li><Link href="#" className="hover:text-white transition-colors">Web Systems</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">Mobile Engineering</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">Cloud Architecture</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-black mb-10 text-[#00d2d3] uppercase text-[10px] tracking-[0.4em]">Resources</h4>
                                <ul className="space-y-5 text-sm text-gray-500 font-bold tracking-tight">
                                    <li><Link href="#" className="hover:text-white transition-colors">Open Source</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">Alumni Network</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">
                        <p>&copy; {new Date().getFullYear()} Plus36 Academy. Professional Technical Education.</p>
                        <p className="mt-4 md:mt-0 italic">(c) PLUS36 NETWORKS</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}