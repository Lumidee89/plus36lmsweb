<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;

class AdminController extends Controller
{
    public function updateAnnouncement(Request $request)
    {
        // Validation
        $request->validate([
            'announcement_text' => 'required|string|max:255',
        ]);

        // Update or Create the setting in the database
        Setting::updateOrCreate(
            ['key' => 'top_announcement'],
            ['value' => $request->announcement_text]
        );

        return back()->with('success', 'Announcement updated successfully!');
    }
}