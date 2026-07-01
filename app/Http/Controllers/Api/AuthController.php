<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\WelcomeEmail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;

class AuthController extends Controller
{
    public function redirectToGoogle(Request $request): RedirectResponse
    {
        $driver = Socialite::driver('google')
            ->stateless()
            ->redirectUrl(route('api.auth.google.callback'));

        if ($request->query('mobile_redirect_uri')) {
            $driver->with(['state' => base64_encode($request->query('mobile_redirect_uri'))]);
        }

        return $driver->redirect();
    }

    public function handleGoogleCallback(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->redirectUrl(route('api.auth.google.callback'))
                ->user();
        } catch (\Throwable $exception) {
            Log::error('Google API SSO failure: '.$exception->getMessage());

            return response()->json([
                'message' => 'Unable to authenticate with Google. Please try again.',
            ], 422);
        }

        if (! $googleUser->getEmail()) {
            return response()->json([
                'message' => 'Google did not return an email address for this account.',
            ], 422);
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
            } catch (\Throwable $exception) {
                Log::error('Mail failure: '.$exception->getMessage());
            }

            $user->activities()->create([
                'description' => 'Created a new student account with Google',
                'type' => 'auth',
            ]);
        }

        $user->activities()->create([
            'description' => 'You signed into the academy portal with Google',
            'type' => 'auth',
        ]);

        $state = $request->query('state');
        if ($state && $mobileUri = base64_decode($state, true)) {
            $token = $user->createToken($request->query('device_name', 'mobile-app'))->plainTextToken;
            return redirect($mobileUri . '?' . http_build_query(['token' => $token]));
        }

        return response()->json([
            'message' => 'Google login successful',
            'token' => $user->createToken($request->query('device_name', 'mobile-app'))->plainTextToken,
            'user' => $user->fresh(),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:student,tutor'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        try {
            Mail::to($user->email)->send(new WelcomeEmail($user));
        } catch (\Throwable $exception) {
            Log::error('Mail failure: '.$exception->getMessage());
        }

        $user->activities()->create([
            'description' => 'Created a new '.$user->role.' account',
            'type' => 'auth',
        ]);

        return response()->json([
            'message' => 'Registration successful',
            'token' => $user->createToken($validated['device_name'] ?? 'mobile-app')->plainTextToken,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $user->activities()->create([
            'description' => 'You signed into the academy portal',
            'type' => 'auth',
        ]);

        return response()->json([
            'message' => 'Login successful',
            'token' => $user->createToken($validated['device_name'] ?? 'mobile-app')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->activities()->create([
            'description' => 'You signed out of the portal',
            'type' => 'auth',
        ]);

        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }
}
