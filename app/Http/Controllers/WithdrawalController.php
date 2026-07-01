<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WithdrawalController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'amount'         => 'required|numeric|min:1',
            'account_name'   => 'required|string|max:255',
            'account_number' => 'required|string|max:20',
            'bank_name'      => 'required|string|max:255',
        ]);

        // Calculate available balance
        $tutorCourseIds = Course::where('user_id', $user->id)->pluck('id');
        $totalEarned    = Enrollment::whereIn('course_id', $tutorCourseIds)->sum('amount_paid');
        $totalWithdrawn = Withdrawal::where('user_id', $user->id)
                            ->whereIn('status', ['pending', 'completed'])
                            ->sum('amount');
        $available = $totalEarned - $totalWithdrawn;

        if ($validated['amount'] > $available) {
            return back()->withErrors([
                'amount' => 'Withdrawal amount exceeds your available balance of ₦' . number_format($available, 2),
            ]);
        }

        Withdrawal::create([
            'user_id'        => $user->id,
            'amount'         => $validated['amount'],
            'account_name'   => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'bank_name'      => $validated['bank_name'],
            'status'         => 'pending',
        ]);

        return back()->with('message', 'Withdrawal request submitted successfully!');
    }

    public function approve(Withdrawal $withdrawal)
    {
        $withdrawal->update(['status' => 'completed']);
        return back()->with('message', 'Withdrawal approved successfully.');
    }

    public function decline(Request $request, Withdrawal $withdrawal)
    {
        $withdrawal->update([
            'status'     => 'rejected',
            'admin_note' => $request->input('note', ''),
        ]);
        return back()->with('message', 'Withdrawal declined.');
    }
}
