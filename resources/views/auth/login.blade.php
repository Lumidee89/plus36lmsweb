@extends('layouts.app')

@section('content')

<div class="min-h-[80vh] flex items-center justify-center bg-[#f0f4f5] py-12 px-6">
    <div class="w-full max-w-md bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50">
        <div class="text-center mb-10">
            <h2 class="text-3xl font-extrabold text-navy">Welcome Back</h2>
            <p class="text-gray-400 mt-2">Login to your academy account</p>
        </div>

        <form method="POST" action="/login" class="space-y-5">
            @csrf
            <div>
                <label class="block text-sm font-bold text-navy mb-2">Email Address</label>
                <input type="email" name="email" placeholder="name@example.com"
                    class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-brand focus:bg-white outline-none transition" required>
            </div>

            <div>
                <label class="block text-sm font-bold text-navy mb-2">Password</label>
                <input type="password" name="password" placeholder="••••••••"
                    class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-brand focus:bg-white outline-none transition" required>
            </div>

            <button class="w-full bg-[#273c66] text-white py-4 rounded-xl font-bold text-lg hover:bg-opacity-95 transition mt-4">
                Login Now
            </button>
            
            <div class="text-center mt-6">
                <span class="text-gray-400">New here?</span> 
                <a href="/register" class="text-teal-brand font-bold hover:underline ml-1">Create an account</a>
            </div>
        </form>
    </div>
</div>

@endsection