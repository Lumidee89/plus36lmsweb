<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('activities'),
        ]);
    }

    public function recentActivities(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 5), 1), 50);

        $activities = $request->user()
            ->activities()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($activity) => [
                'id'          => $activity->id,
                'type'        => $activity->type,
                'description' => $activity->description,
                'created_at'  => $activity->created_at,
                'updated_at'  => $activity->updated_at,
            ]);

        return response()->json([
            'activities' => $activities,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'avatar'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user->fill([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('uploads')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'uploads');
        }

        $user->save();

        $user->activities()->create([
            'description' => 'Updated account profile details',
            'type'        => 'settings',
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user->fresh(),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('uploads')->delete($user->avatar);
        }

        $user->avatar = $request->file('avatar')->store('avatars', 'uploads');
        $user->save();

        return response()->json([
            'message'    => 'Avatar updated successfully',
            'avatar_url' => $user->avatar_url,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        if ($user->avatar) {
            Storage::disk('uploads')->delete($user->avatar);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Account deleted successfully',
        ]);
    }
}
