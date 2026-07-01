<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\WelcomeEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia; // Import the Inertia facade
use Laravel\Socialite\Facades\Socialite;

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
     * Send the user to Google's OAuth consent screen.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Create or update a student account from Google and log the user in.
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $exception) {
            Log::error('Google SSO failure: '.$exception->getMessage());

            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Unable to authenticate with Google. Please try again.']);
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'google_avatar' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Google User',
                'email' => $googleUser->getEmail(),
                'password' => Hash::make(Str::random(32)),
                'role' => 'student',
                'google_id' => $googleUser->getId(),
                'google_avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]);

            try {
                Mail::to($user->email)->send(new WelcomeEmail($user));
            } catch (\Exception $e) {
                Log::error("Mail failure: " . $e->getMessage());
            }

            $user->activities()->create([
                'description' => 'Created a new student account with Google',
                'type' => 'auth'
            ]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        $user->activities()->create([
            'description' => 'You signed into the academy portal with Google',
            'type' => 'auth'
        ]);

        return redirect()->intended('/dashboard');
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
