<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class FacultyController extends Controller
{
    /**
     * Store a newly created faculty category in the database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:faculties,name',
        ]);

        Faculty::create([
            'name' => $request->name,
        ]);

        return Redirect::back()->with('message', 'Faculty category created successfully!');
    }
}