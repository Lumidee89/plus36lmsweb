<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plus36 Academy - Learn Better</title>
    <!-- Modern Sans Font -->
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    @vite('resources/css/app.css')
    <style>
        body { font-family: 'Jost', sans-serif; background-color: #f0f4f5; }
        .text-navy { color: #273c66; }
        .bg-teal-brand { background-color: #1ab69d; }
        .text-teal-brand { color: #1ab69d; }
    </style>
</head>
<body class="text-slate-700 antialiased">

    <!-- Top Bar -->
    <div class="bg-[#273c66] text-white text-center py-2 text-sm font-medium">
        {{ \App\Models\Setting::where('key', 'top_announcement')->value('value') ?? 'Your learning journey begins here – now with an exclusive discount!' }}
    </div>

    <!-- Navigation -->
    <nav class="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-12">
                <a href="/" class="text-2xl font-bold text-navy flex items-center">
                    <span class="bg-teal-brand text-white p-1 rounded mr-2">P36</span> Plus36
                </a>
                <!-- Links shown to everyone -->
                <div class="hidden md:flex space-x-8 font-medium text-navy">
                    <a href="/" class="{{ request()->is('/') ? 'text-teal-brand' : 'hover:text-teal-brand transition' }}">Home</a>
                    <a href="#" class="hover:text-teal-brand transition">Courses</a>
                    <a href="#" class="hover:text-teal-brand transition">Contact</a>
                </div>
            </div>

            <div class="flex items-center space-x-6">
                @guest
                    <!-- Shown ONLY when NOT logged in -->
                    <a href="/login" class="font-semibold text-navy flex items-center">
                        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Login
                    </a>
                    <a href="/register" class="bg-teal-brand text-white px-6 py-3 rounded-md font-bold hover:bg-opacity-90 transition shadow-lg shadow-teal-500/20">
                        Start Learning Now
                    </a>
                @endguest

                @auth
                    <!-- Shown ONLY when LOGGED IN -->
                    <div class="flex items-center space-x-4 border-l pl-6 border-gray-100">
                        <a href="/dashboard" class="flex items-center space-x-3 group">
                            <div class="text-right hidden sm:block">
                                <p class="text-sm font-bold text-navy leading-none group-hover:text-teal-brand transition">{{ Auth::user()->name }}</p>
                                <p class="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{{ Auth::user()->role }}</p>
                            </div>
                            <div class="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-brand font-bold shadow-sm group-hover:bg-teal-brand group-hover:text-white transition duration-200">
                                {{ substr(Auth::user()->name, 0, 1) }}
                            </div>
                        </a>
                        
                        <!-- Logout button (Icon only for clean look) -->
                        <form action="/logout" method="POST" class="inline">
                            @csrf
                            <button type="submit" class="text-gray-400 hover:text-red-500 transition" title="Logout">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        </form>
                    </div>
                @endauth
            </div>
        </div>
    </nav>

    <main>
        @yield('content')
    </main>

    {{-- <footer class="bg-white py-12 mt-20 border-t border-gray-100 text-center">
        <p class="text-gray-400 text-sm">&copy; {{ date('Y') }} Plus36 Academy. All Rights Reserved.</p>
    </footer> --}}

</body>
</html>