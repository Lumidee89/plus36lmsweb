<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\WelcomeEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia; // Import the Inertia facade

class AuthController extends Controller
{
    /**
     * Show the login interface using Inertia.
     */
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Show the registration interface using Inertia.
     */
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle registration and redirect to dashboard.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:student,tutor'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        try {
            Mail::to($user->email)->send(new WelcomeEmail($user));
        } catch (\Exception $e) {
            Log::error("Mail failure: " . $e->getMessage());
        }

        Auth::login($user);

        $user->activities()->create([
            'description' => 'Created a new ' . $user->role . ' account',
            'type' => 'auth'
        ]);

        return redirect()->intended('/dashboard');
    }

    /**
     * Handle login and redirect to intended page.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            auth()->user()->activities()->create([
                'description' => 'You signed into the academy portal',
                'type' => 'auth'
            ]);

            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Log out and redirect to home.
     */
    public function logout(Request $request)
    {
        if (Auth::check()) {
            auth()->user()->activities()->create([
                'description' => 'You signed out of the portal',
                'type' => 'auth'
            ]);
        }

        Auth::logout();
        
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}