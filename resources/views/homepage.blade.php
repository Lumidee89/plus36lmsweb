@extends('layouts.app')

@section('content')

<!-- Modern Hero Section -->
<section class="relative bg-[#fbfcfd] pt-20 pb-32 overflow-hidden">
    {{-- Background Accents --}}
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#1a1d21 1px, transparent 1px); background-size: 40px 40px;"></div>

    <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="grid lg:grid-cols-12 gap-16 items-center">
            <div class="lg:col-span-7">
                <div class="inline-flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm mb-8">
                    <span class="flex h-2 w-2 rounded-full bg-[#00d2d3] animate-pulse"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-navy">20,000+ Quality Courses</span>
                </div>
                
                <h1 class="text-7xl font-black text-[#1a1d21] leading-[1.1] tracking-tighter mb-8">
                    Master the <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2d3] to-teal-600">Digital Craft.</span>
                </h1>
                
                <p class="text-gray-500 text-xl leading-relaxed mb-12 max-w-xl">
                    High-impact technical education for the next generation of software engineers and founders.
                </p>

                <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <a href="/register" class="w-full sm:w-auto bg-[#1a1d21] text-white px-10 py-5 rounded-2xl font-bold hover:bg-[#00d2d3] hover:text-black transition-all duration-500 shadow-2xl shadow-gray-200">
                        Start Learning Now
                    </a>
                    <div class="flex items-center space-x-4">
                        <div class="flex -space-x-3">
                            @foreach(['A', 'B', 'C'] as $index => $seed)
                                <div class="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-100">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed={{ $seed }}&mask=true" alt="Student">
                                </div>
                            @endforeach
                        </div>
                        <span class="text-sm font-bold text-gray-400">Join {{ number_format($totalEnrolled) }}+ Students</span>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-5 relative">
                <div class="relative bg-white p-4 rounded-[2rem] shadow-2xl rotate-2">
                    <div class="rounded-[1.5rem] overflow-hidden aspect-[4/5] bg-gray-100">
                        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700">
                    </div>
                    
                    {{-- Live Data Floating Card --}}
                    <div class="absolute -bottom-10 -left-10 bg-[#1a1d21] p-8 rounded-3xl shadow-2xl -rotate-2 border border-white/10">
                        <p class="text-[#00d2d3] text-4xl font-black mb-1 leading-none">
                            {{ number_format($totalEnrolled > 1000 ? ($totalEnrolled / 1000) : 0, 1) }}K
                        </p>
                        <p class="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Live Enrollment</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Grid-Based Categories -->
<section class="py-24 bg-white border-y border-gray-100">
    <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
                <h2 class="text-4xl font-black text-[#1a1d21] tracking-tighter">Top Faculties</h2>
                <p class="text-gray-400 mt-2">Specialized tracks designed for scale.</p>
            </div>
            <div class="flex space-x-2">
                <div class="h-1.5 w-12 bg-[#00d2d3] rounded-full"></div>
                <div class="h-1.5 w-4 bg-gray-100 rounded-full"></div>
            </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @foreach(['Mathematics', 'Development', 'Chemistry', 'Business', 'Marketing', 'Design', 'Technology', 'Health'] as $cat)
            <div class="group bg-[#f8f9fb] p-8 rounded-3xl hover:bg-[#1a1d21] transition-all duration-500 cursor-pointer">
                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-navy shadow-sm group-hover:bg-[#00d2d3] transition-colors mb-6">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
                </div>
                <span class="font-black text-[#1a1d21] group-hover:text-white transition-colors uppercase text-xs tracking-widest">{{ $cat }}</span>
            </div>
            @endforeach
        </div>
    </div>
</section>

<!-- Course Collection -->
<section class="py-32 bg-[#fbfcfd]">
    <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20">
            <h2 class="text-5xl font-black text-[#1a1d21] tracking-tight mb-4">Curriculum.</h2>
            <p class="text-gray-400 max-w-lg mx-auto leading-relaxed">Industry-standard courses vetted by senior developers and technical founders.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-10">
            @for ($i = 0; $i < 3; $i++)
            <div class="group">
                <div class="relative rounded-[2rem] overflow-hidden mb-8 shadow-xl">
                    <div class="absolute inset-0 bg-navy/20 group-hover:bg-transparent transition-colors z-10"></div>
                    <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80" class="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute top-6 left-6 z-20">
                        <span class="bg-white/90 backdrop-blur-md text-black text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">Development</span>
                    </div>
                </div>
                <div class="px-2">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-6 h-6 rounded-full bg-[#00d2d3]"></div>
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructed by Plus36</span>
                    </div>
                    <h3 class="text-2xl font-black text-[#1a1d21] mb-6 group-hover:text-[#00d2d3] transition-colors">Modern Web Architecture with React & Laravel</h3>
                    <div class="flex items-center justify-between">
                        <span class="text-2xl font-black text-[#1a1d21]">$29.00</span>
                        <a href="#" class="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-[#1a1d21] group-hover:text-white transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>
            </div>
            @endfor
        </div>
    </div>
</section>

<!-- Statistics (Dark Mode) -->
<section class="py-24 bg-[#1a1d21] relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        <div class="space-y-2">
            <p class="text-[#00d2d3] text-6xl font-black tracking-tighter">{{ number_format($totalEnrolled) }}</p>
            <p class="text-gray-500 uppercase text-[9px] font-black tracking-[0.3em]">Total Students</p>
        </div>
        <div class="space-y-2">
            <p class="text-[#00d2d3] text-6xl font-black tracking-tighter">15+</p>
            <p class="text-gray-500 uppercase text-[9px] font-black tracking-[0.3em]">Web Projects</p>
        </div>
        <div class="space-y-2">
            <p class="text-[#00d2d3] text-6xl font-black tracking-tighter">08+</p>
            <p class="text-gray-500 uppercase text-[9px] font-black tracking-[0.3em]">Mobile Apps</p>
        </div>
        <div class="space-y-2">
            <p class="text-[#00d2d3] text-6xl font-black tracking-tighter">24/7</p>
            <p class="text-gray-500 uppercase text-[9px] font-black tracking-[0.3em]">Technical Support</p>
        </div>
    </div>
</section>

<!-- Success Stories -->
<section class="py-32 bg-white">
    <div class="max-w-7xl mx-auto px-6">
        <div class="grid lg:grid-cols-2 gap-20 items-center">
            <div>
                <h2 class="text-6xl font-black text-[#1a1d21] tracking-tighter mb-8 leading-tight">What our <br> <span class="text-[#00d2d3]">graduates</span> say.</h2>
                <div class="space-y-12">
                    @foreach(['Developer Alpha', 'Founder Beta'] as $name)
                    <div class="relative pl-12">
                        <div class="absolute left-0 top-0 text-5xl font-serif text-[#00d2d3] opacity-20">“</div>
                        <p class="text-xl text-gray-500 italic mb-6 leading-relaxed">
                            The practical approach at Plus36 Academy changed how I build products. The knowledge is immediate and impactful.
                        </p>
                        <div class="flex items-center space-x-4">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed={{ $name }}&mask=true" class="w-12 h-12 rounded-full border border-gray-100">
                            <div>
                                <h4 class="font-black text-navy text-sm uppercase">{{ $name }}</h4>
                                <p class="text-[10px] font-black text-[#00d2d3] uppercase tracking-widest">Alumni</p>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            <div class="hidden lg:block">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-4">
                        <div class="h-64 bg-gray-100 rounded-[2rem] overflow-hidden"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80" class="w-full h-full object-cover"></div>
                        <div class="h-40 bg-[#00d2d3] rounded-[2rem]"></div>
                    </div>
                    <div class="space-y-4 pt-12">
                        <div class="h-40 bg-navy rounded-[2rem]"></div>
                        <div class="h-64 bg-gray-100 rounded-[2rem] overflow-hidden"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" class="w-full h-full object-cover"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Minimal FAQ -->
<section class="py-32 bg-[#fbfcfd] border-t border-gray-100">
    <div class="max-w-4xl mx-auto px-6">
        <div class="text-center mb-20">
            <span class="text-[#00d2d3] font-black uppercase text-[10px] tracking-[0.3em] mb-4 block">F.A.Q</span>
            <h2 class="text-4xl font-black text-navy tracking-tight">Need Clarity?</h2>
        </div>
        
        <div class="space-y-2">
            @foreach([
                'Access' => 'How do I access my certificates?',
                'Curriculum' => 'Are the courses beginner-friendly?',
                'Support' => 'Do you offer support for projects?'
            ] as $label => $question)
            <div class="group border-b border-gray-100">
                <details class="peer">
                    <summary class="flex items-center justify-between py-8 cursor-pointer list-none outline-none">
                        <div class="flex items-center space-x-6">
                            <span class="text-[10px] font-black text-[#00d2d3] uppercase tracking-widest w-20">{{ $label }}</span>
                            <span class="text-xl font-bold text-navy group-hover:text-[#00d2d3] transition-colors">{{ $question }}</span>
                        </div>
                        <div class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center peer-open:rotate-45 transition-transform">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </div>
                    </summary>
                    <div class="pl-32 pr-10 pb-10 text-gray-500 leading-relaxed max-w-2xl">
                        Comprehensive answers provided to ensure you can focus entirely on your learning journey without friction.
                    </div>
                </details>
            </div>
            @endforeach
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="bg-[#1a1d21] pt-32 pb-12 text-white">
    <div class="max-w-7xl mx-auto px-6">
        <div class="grid lg:grid-cols-12 gap-16 mb-24">
            <div class="lg:col-span-5">
                <div class="flex items-center space-x-3 mb-8">
                    <div class="w-12 h-12 bg-[#00d2d3] rounded-xl flex items-center justify-center text-black font-black">P36</div>
                    <span class="text-2xl font-black tracking-tighter uppercase">Plus36<span class="text-[#00d2d3]">Academy</span></span>
                </div>
                <p class="text-gray-500 text-lg leading-relaxed max-w-sm">
                    Architecting the next generation of technical excellence. Join the circle.
                </p>
            </div>
            <div class="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
                <div>
                    <h4 class="font-black mb-8 text-[#00d2d3] uppercase text-[10px] tracking-widest">Track</h4>
                    <ul class="space-y-4 text-sm text-gray-400 font-bold">
                        <li><a href="#" class="hover:text-white transition">Web Development</a></li>
                        <li><a href="#" class="hover:text-white transition">Mobile Mastery</a></li>
                        <li><a href="#" class="hover:text-white transition">Leadership</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-black mb-8 text-[#00d2d3] uppercase text-[10px] tracking-widest">Connect</h4>
                    <ul class="space-y-4 text-sm text-gray-400 font-bold">
                        <li><a href="#" class="hover:text-white transition">X / Twitter</a></li>
                        <li><a href="#" class="hover:text-white transition">TikTok</a></li>
                        <li><a href="#" class="hover:text-white transition">LinkedIn</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
            <p>&copy; {{ date('Y') }} Plus36 Academy. All rights reserved.</p>
            <p>Designed for the ambitious.</p>
        </div>
    </div>
</footer>

@endsection