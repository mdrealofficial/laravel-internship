<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthCompatController extends Controller
{
    private function formatUserSession($user)
    {
        if (!$user) {
            return ['session' => null];
        }

        $profile = $user->profile;

        return [
            'session' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'user_metadata' => [
                        'full_name' => $profile ? $profile->full_name : $user->name,
                    ]
                ]
            ]
        ];
    }

    public function session(Request $request)
    {
        $user = Auth::user();
        return response()->json($this->formatUserSession($user));
    }

    public function signin(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, true)) {
            $request->session()->regenerate();
            $user = Auth::user();

            // Create profile or role if missing
            $this->ensureProfileAndRole($user);

            return response()->json([
                'session' => $this->formatUserSession($user)['session'],
                'error' => null
            ]);
        }

        return response()->json([
            'session' => null,
            'error' => 'Invalid email or password'
        ], 401);
    }

    public function signup(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');
        $fullName = $request->input('options.data.full_name') ?? $request->input('fullName') ?? 'New User';

        if (User::where('email', $email)->exists()) {
            return response()->json([
                'session' => null,
                'error' => 'This email address is already registered.'
            ], 400);
        }

        try {
            $user = User::create([
                'id' => (string) Str::uuid(),
                'name' => $fullName,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            Profile::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'email' => $user->email,
                'full_name' => $fullName,
            ]);

            // Assign default role. If it is the very first user, let's make them an admin!
            // Otherwise, default to intern.
            $isFirstUser = UserRole::count() === 0;
            $roleName = $isFirstUser ? 'admin' : 'intern';

            UserRole::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'role' => $roleName,
                'created_at' => now(),
            ]);

            Auth::login($user, true);
            $request->session()->regenerate();

            return response()->json([
                'session' => $this->formatUserSession($user)['session'],
                'error' => null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'session' => null,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function signout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'error' => null
        ]);
    }

    private function ensureProfileAndRole($user)
    {
        if (!$user->profile) {
            Profile::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'email' => $user->email,
                'full_name' => $user->name,
            ]);
        }

        if ($user->roles()->count() === 0) {
            // First user admin, otherwise intern
            $roleName = User::count() === 1 ? 'admin' : 'intern';
            UserRole::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'role' => $roleName,
                'created_at' => now(),
            ]);
        }
    }

    public function updateUser(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'data' => null,
                'error' => 'Not authenticated'
            ], 401);
        }

        $password = $request->input('password');
        $userData = $request->input('data');

        try {
            if ($password) {
                $user->password = Hash::make($password);
            }

            if ($userData && isset($userData['full_name'])) {
                $user->name = $userData['full_name'];
            }

            $user->save();

            // Also update profile if full_name was changed
            if ($userData && isset($userData['full_name'])) {
                $profile = $user->profile;
                if ($profile) {
                    $profile->full_name = $userData['full_name'];
                    $profile->save();
                }
            }

            return response()->json([
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'user_metadata' => [
                            'full_name' => $user->profile ? $user->profile->full_name : $user->name,
                        ]
                    ]
                ],
                'error' => null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'data' => null,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
