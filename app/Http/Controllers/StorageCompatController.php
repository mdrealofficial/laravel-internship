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

        // Strict server-side validation: Max 10MB, strictly whitelisted extensions
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'svg'];
        $dangerousExtensions = ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'phar', 'sh', 'bash', 'exe', 'bat', 'cmd', 'bin', 'js', 'html', 'htm', 'shtml', 'cgi', 'pl', 'py'];

        $file = $request->file('file');

        if (!$file->isValid()) {
            return response()->json([
                'data' => null,
                'error' => 'Invalid file upload'
            ], 400);
        }

        // 10MB file size limit
        if ($file->getSize() > 10 * 1024 * 1024) {
            return response()->json([
                'data' => null,
                'error' => 'File size exceeds 10MB limit'
            ], 422);
        }

        $clientExtension = strtolower($file->getClientOriginalExtension());
        $guessedExtension = strtolower($file->guessExtension() ?? '');

        // Disallow dangerous extensions immediately
        if (in_array($clientExtension, $dangerousExtensions, true) || in_array($guessedExtension, $dangerousExtensions, true)) {
            return response()->json([
                'data' => null,
                'error' => 'File type not allowed for security reasons.'
            ], 422);
        }

        if (!in_array($clientExtension, $allowedExtensions, true)) {
            return response()->json([
                'data' => null,
                'error' => 'Unsupported file extension. Allowed: ' . implode(', ', $allowedExtensions)
            ], 422);
        }

        try {
            // Clean path and prevent directory traversal (e.g., ../ or ..\)
            $cleanPath = trim(str_replace(['../', '..\\'], '', $path ?? ''), '/');
            
            // Get directory and filename from the provided path
            $dir = dirname($cleanPath);
            if ($dir === '.' || empty($dir)) {
                $dir = '';
            }

            // Ensure bucket name is strictly alphanumeric/dashes
            $bucket = preg_replace('/[^a-zA-Z0-9_\-]/', '', $bucket);

            // Sanitize filename to avoid null byte or control characters
            $rawFilename = basename($cleanPath);
            $cleanFilename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $rawFilename);
            if (empty($cleanFilename) || !str_contains($cleanFilename, '.')) {
                $cleanFilename = Str::uuid() . '.' . $clientExtension;
            }

            // Save to public disk inside the bucket directory
            // E.g. public/company-assets/applications/filename
            $targetDir = $dir ? "{$bucket}/{$dir}" : "{$bucket}";
            $storedPath = $file->storeAs($targetDir, $cleanFilename, 'public');

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

    public function serve($bucket, $path)
    {
        try {
            $fullPath = "{$bucket}/{$path}";
            
            if (!Storage::disk('public')->exists($fullPath)) {
                abort(404);
            }

            $filePath = Storage::disk('public')->path($fullPath);
            $mimeType = Storage::disk('public')->mimeType($fullPath) ?: mime_content_type($filePath);

            return response()->file($filePath, [
                'Content-Type' => $mimeType,
                'Access-Control-Allow-Origin' => '*',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        } catch (\Exception $e) {
            abort(404);
        }
    }
}

