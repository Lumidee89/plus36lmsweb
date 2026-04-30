@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-[#f8f9fd] py-6 px-4 md:px-8">
    <div class="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6">
        
        <!-- SIDEBAR NAVIGATION -->
        <aside class="w-full lg:w-64 flex-shrink-0">
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 h-full">
                <!-- Logo -->
                <nav class="space-y-6">
                    <!-- MAIN TABS -->
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">Overview</p>
                        <div class="space-y-1">
                            <!-- COMMON: Dashboard -->
                            <a href="/dashboard" class="flex items-center space-x-3 p-3 {{ !request()->has('tab') ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                                <span>Dashboard</span>
                            </a>

                            <!-- ADMIN LINKS -->
                            @if(Auth::user()->role == 'admin')
                                <a href="?tab=courses" class="flex items-center space-x-3 p-3 {{ request('tab') == 'courses' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                    <span>Courses</span>
                                </a>
                                <a href="?tab=students" class="flex items-center space-x-3 p-3 {{ request('tab') == 'students' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    <span>Students</span>
                                </a>
                                <a href="?tab=revenue" class="flex items-center space-x-3 p-3 {{ request('tab') == 'revenue' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                    <span>Revenue</span>
                                </a>

                            <!-- TUTOR LINKS -->
                            @elseif(Auth::user()->role == 'tutor')
                                <a href="?tab=my-courses" class="flex items-center space-x-3 p-3 {{ request('tab') == 'my-courses' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    <span>My Courses</span>
                                </a>
                                <a href="?tab=earnings" class="flex items-center space-x-3 p-3 {{ request('tab') == 'earnings' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>Earnings</span>
                                </a>

                            <!-- STUDENT LINKS -->
                            @else
                                <a href="?tab=my-courses" class="flex items-center space-x-3 p-3 {{ request('tab') == 'my-courses' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                    <span>My Courses</span>
                                </a>
                                <a href="?tab=certs" class="flex items-center space-x-3 p-3 {{ request('tab') == 'certs' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                    <span>Certificates</span>
                                </a>
                            @endif
                        </div>
                    </div>

                    <!-- SETTINGS & LOGOUT -->
                    <div class="pt-6 border-t border-gray-100">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">Settings</p>
                        <div class="space-y-1">
                            @if(Auth::user()->role == 'admin')
                                <a href="?tab=settings" class="flex items-center space-x-3 p-3 {{ request('tab') == 'settings' ? 'bg-teal-50 text-teal-brand font-bold' : 'text-gray-400 hover:bg-gray-50' }} rounded-2xl transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <span>Settings</span>
                                </a>
                            @endif

                            <form action="/logout" method="POST">
                                @csrf
                                <button class="flex items-center space-x-3 p-3 text-gray-400 hover:text-red-500 transition w-full font-bold">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                    <span>Logout</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </nav>
            </div>
        </aside>

        <!-- MAIN CONTENT AREA -->
        <main class="flex-1 space-y-6">
            
            <!-- HEADER: Search & Profile (Top Bar) -->
            <div class="flex items-center justify-between gap-4">
                <div class="relative flex-1 max-w-xl">
                    <input type="text" placeholder="Search courses, lessons..." class="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-teal-500 outline-none transition">
                    <svg class="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            @if(!request()->has('tab'))
                <!-- DASHBOARD HOME (From Screenshot) -->
                
                <!-- Hero Banner -->
                <div class="relative bg-gradient-to-r from-teal-600 to-teal-500 rounded-[2.5rem] p-10 text-white overflow-hidden shadow-xl shadow-indigo-100">
                    <div class="relative z-10 max-w-md">
                        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Welcome Back</p>
                        <h1 class="text-4xl font-extrabold mb-6 leading-tight">Ready to master a new skill today?</h1>
                        <button class="bg-black text-white px-8 py-3 rounded-full font-bold flex items-center space-x-3 hover:scale-105 transition">
                            <span>Get Started</span>
                            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                            </div>
                        </button>
                    </div>
                    <svg class="absolute right-0 top-0 h-full opacity-20" viewBox="0 0 200 200" fill="white"><path d="M100 0L110 90L200 100L110 110L100 200L90 110L0 100L90 90Z"/></svg>
                </div>

                <!-- Stats/Progress Overview -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center space-x-4">
                        <div class="w-10 h-10 bg-indigo-50 text-teal-500 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-gray-400">Total Courses</p>
                            <p class="font-bold text-navy">12 Enrolled</p>
                        </div>
                    </div>
                    <!-- ... Add more cards as needed -->
                </div>

            @elseif(request('tab') == 'settings' && Auth::user()->role == 'admin')
                <!-- ADMIN SETTINGS TAB -->
                <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-50">
                    <h3 class="text-2xl font-black text-navy mb-6">System Announcements</h3>
                    <form action="{{ route('admin.update_announcement') }}" method="POST" class="space-y-4">
                        @csrf
                        <textarea name="announcement_text" rows="3" class="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition">{{ \App\Models\Setting::where('key', 'top_announcement')->value('value') }}</textarea>
                        <button type="submit" class="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-indigo-100">Save Announcement</button>
                    </form>
                </div>

            @else
                <!-- DYNAMIC TAB PLACEHOLDER -->
                <div class="bg-white p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                    <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-10 h-10 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </div>
                    <h3 class="text-xl font-black text-navy">Section Under Development</h3>
                    <p class="text-gray-400">The {{ ucfirst(request('tab')) }} management area is being optimized.</p>
                </div>
            @endif

        </main>

        <!-- RIGHT STATS PANEL (From Screenshot) -->
        <aside class="w-full lg:w-80 space-y-6">
            <!-- Profile Stat Circle -->
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 text-center">
                <div class="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="10" fill="transparent" class="text-gray-100" />
                        <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="10" fill="transparent" stroke-dasharray="440" stroke-dashoffset="120" class="text-teal-600" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <div class="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-teal-600 font-bold text-2xl border-4 border-white shadow-lg">
                             {{ substr(Auth::user()->name, 0, 1) }}
                        </div>
                    </div>
                </div>
                <h4 class="font-black text-navy text-lg">Hello, {{ explode(' ', Auth::user()->name)[0] }}!</h4>
                <p class="text-gray-400 text-xs mt-2">You have completed 75% of your weekly target.</p>
            </div>

            <!-- Recent Notifications/Activity -->
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <h3 class="font-black text-navy mb-6">Recent Activity</h3>
                <div class="space-y-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>
                        <div>
                            <p class="text-xs font-black text-navy">Payment Received</p>
                            <p class="text-[10px] font-bold text-gray-400">2 hours ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

    </div>
</div>
@endsection