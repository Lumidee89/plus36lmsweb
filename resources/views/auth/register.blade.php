@extends('layouts.app')

@section('content')

<div class="min-h-[90vh] flex items-center justify-center bg-[#f0f4f5] py-16 px-6">
    <div class="w-full max-w-xl bg-white p-10 md:p-14 rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-white">
        
        <!-- Header -->
        <div class="text-center mb-10">
            <span class="text-teal-brand font-bold text-sm tracking-widest uppercase">Join Plus36 Academy</span>
            <h2 class="text-4xl font-extrabold text-navy mt-2">Create Your Account</h2>
            <p class="text-gray-400 mt-3">Start your journey toward mastering high-income skills.</p>
        </div>

        <form method="POST" action="/register" class="space-y-6">
            @csrf

            <!-- Name Field -->
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-bold text-navy mb-2">Full Name</label>
                    <input type="text" name="name" placeholder="John Doe"
                        class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-teal-brand focus:bg-white focus:border-transparent outline-none transition duration-200" required>
                </div>

                <!-- Email Field -->
                <div>
                    <label class="block text-sm font-bold text-navy mb-2">Email Address</label>
                    <input type="email" name="email" placeholder="name@example.com"
                        class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-teal-brand focus:bg-white focus:border-transparent outline-none transition duration-200" required>
                </div>
            </div>

            <!-- Password Field -->
            <div>
                <label class="block text-sm font-bold text-navy mb-2">Password</label>
                <input type="password" name="password" placeholder="••••••••"
                    class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-teal-brand focus:bg-white focus:border-transparent outline-none transition duration-200" required>
                <p class="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Must be at least 8 characters long</p>
            </div>

            <!-- Role Selection -->
            <div>
                <label class="block text-sm font-bold text-navy mb-2">I want to join as a...</label>
                <div class="relative">
                    <select name="role" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-teal-brand focus:bg-white focus:border-transparent outline-none transition duration-200 appearance-none cursor-pointer">
                        <option value="student">Student (I want to learn)</option>
                        <option value="tutor">Tutor (I want to teach)</option>
                    </select>
                    <!-- Custom Arrow Icon -->
                    <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4">
                <button class="w-full bg-teal-brand text-white py-5 rounded-xl font-bold text-lg hover:bg-[#169a85] hover:translate-y-[-2px] transition duration-300 shadow-xl shadow-teal-500/20">
                    Get Started Now
                </button>
            </div>
            
            <!-- Login Link -->
            <div class="text-center mt-8 pt-6 border-t border-gray-50">
                <span class="text-gray-400">Already have an account?</span> 
                <a href="/login" class="text-teal-brand font-bold hover:underline ml-1">Login here</a>
            </div>
        </form>
    </div>
</div>

@endsection