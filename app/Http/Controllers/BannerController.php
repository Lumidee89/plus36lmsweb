<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BannerController extends Controller
{
    public function index()
    {
        $banners = DB::table('mobile_banners')->where('is_active', true)->orderBy('position')->get()->map(fn ($banner) => [...(array) $banner, 'image_url' => Storage::disk('uploads')->url($banner->image_path)]);

        return response()->json(['banners' => $banners]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'subtitle' => 'nullable|string|max:500', 'image' => 'required|image|max:5120', 'action_url' => 'nullable|url']);
        DB::table('mobile_banners')->insert(['title' => $data['title'], 'subtitle' => $data['subtitle'] ?? null, 'image_path' => $request->file('image')->store('banners', 'uploads'), 'action_url' => $data['action_url'] ?? null, 'is_active' => true, 'position' => DB::table('mobile_banners')->count() + 1, 'created_at' => now(), 'updated_at' => now()]);

        return back()->with('message', 'Mobile banner published.');
    }

    public function destroy(int $banner)
    {
        $record = DB::table('mobile_banners')->find($banner);
        abort_unless($record, 404);
        Storage::disk('uploads')->delete($record->image_path);
        DB::table('mobile_banners')->where('id', $banner)->delete();

        return back()->with('message', 'Banner removed.');
    }
}
