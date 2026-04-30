<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    /**
     * Store a newly created course in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'faculty_id' => 'required|exists:faculties,id',
            'price' => 'required|numeric',
            'duration' => 'required|string',
        ]);

        $request->user()->courses()->create($validated);

        return back()->with('message', 'Course published successfully to the Academy!');
    }
    public function storeLesson(Request $request) 
    {
        $request->validate(['lesson_title' => 'required', 'course_id' => 'required']);
        
        \App\Models\Lesson::create([
            'title' => $request->lesson_title,
            'course_id' => $request->course_id,
        ]);

        return back()->with('message', 'Lesson added to the curriculum!');
    }
    public function storeTopic(Request $request)
    {
        $validated = $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'title'     => 'required|string|max:255',
            'type'      => 'required|in:video,pdf,text',
            'content'   => 'required_if:type,text|nullable|string',
            'video_url' => 'nullable|url',
            'file'      => 'nullable|file|max:102400',
        ]);

        $data = [
            'lesson_id' => $validated['lesson_id'],
            'title'     => $validated['title'],
            'type'      => $validated['type'],
            'video_url' => $validated['video_url'] ?? null,
            'order'     => \App\Models\Topic::where('lesson_id', $validated['lesson_id'])->count() + 1,
        ];

        if ($validated['type'] === 'text') {
            $data['content'] = $validated['content'];
        } 
        elseif ($request->hasFile('file')) {
            $folder = $validated['type'] === 'video' ? 'videos' : 'materials';
            $path = $request->file('file')->store($folder, 'public');
            $data['content'] = $path; 
        }

        $topic = \App\Models\Topic::create($data);

        if ($topic) {
            return back()->with('message', 'Content published successfully!');
        }

        return back()->withErrors(['error' => 'Failed to save to database.']);
    }
}