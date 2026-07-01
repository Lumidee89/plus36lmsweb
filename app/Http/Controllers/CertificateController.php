<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function show(Certificate $certificate)
    {
        $user = Auth::user();
        if ($certificate->user_id !== $user->id && $user->role !== 'admin') {
            abort(403);
        }

        $certificate->load(['user', 'course.user']);

        return Inertia::render('CertificatePage', [
            'certificate' => $certificate,
        ]);
    }
}
