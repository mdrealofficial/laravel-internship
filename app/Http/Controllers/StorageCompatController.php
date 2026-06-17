<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorageCompatController extends Controller
{
    public function upload(Request $request)
    {
        $bucket = $request->input('bucket', 'company-assets');
        $path = $request->input('path');

        if (!$request->hasFile('file')) {
            return response()->json([
                'data' => null,
                'error' => 'No file uploaded'
            ], 400);
        }

        try {
            $file = $request->file('file');
            
            // Clean path
            $cleanPath = trim($path, '/');
            
            // Get directory and filename from the provided path
            $dir = dirname($cleanPath);
            $filename = basename($cleanPath);

            // Save to public disk inside the bucket directory
            // E.g. public/company-assets/applications/filename
            $targetDir = "{$bucket}/{$dir}";
            $storedPath = $file->storeAs($targetDir, $filename, 'public');

            return response()->json([
                'data' => [
                    'path' => $storedPath
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
