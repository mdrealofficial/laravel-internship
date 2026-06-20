<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Artisan;
use ZipArchive;

class SystemUpdateController extends Controller
{
    public function update(Request $request)
    {
        // 1. Authorize Admin user
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized. Please log in first.'
            ], 401);
        }

        $isAdmin = $user->roles()->where('role', 'admin')->exists();
        if (!$isAdmin) {
            return response()->json([
                'success' => false,
                'error' => 'Forbidden. Only administrators can update the system.'
            ], 403);
        }

        // 2. Validate the uploaded file
        if (!$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'error' => 'No file uploaded.'
            ], 400);
        }

        $file = $request->file('file');
        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'error' => 'Uploaded file is invalid: ' . $file->getErrorMessage()
            ], 400);
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if ($extension !== 'zip') {
            return response()->json([
                'success' => false,
                'error' => 'Invalid file format. Only ZIP archives are allowed.'
            ], 400);
        }

        // 3. Define temporary paths
        $tempDirName = 'system_update_' . uniqid();
        $tempExtractDir = storage_path('app/' . $tempDirName);
        $zipFilePath = $file->getRealPath();

        // 4. Open and extract ZIP
        $zip = new ZipArchive;
        $openResult = $zip->open($zipFilePath);
        
        if ($openResult !== true) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to open ZIP archive. Error code: ' . $openResult
            ], 500);
        }

        if (!is_dir($tempExtractDir)) {
            mkdir($tempExtractDir, 0755, true);
        }

        $extractResult = $zip->extractTo($tempExtractDir);
        $zip->close();

        if (!$extractResult) {
            $this->recursiveDelete($tempExtractDir);
            return response()->json([
                'success' => false,
                'error' => 'Failed to extract ZIP archive files.'
            ], 500);
        }

        try {
            // 5. Determine the source directory inside extracted folder
            // (in case the ZIP contains a single root folder containing the project files)
            $scanned = array_diff(scandir($tempExtractDir), ['.', '..', '__MACOSX']);
            
            $sourceDir = $tempExtractDir;
            if (count($scanned) === 1) {
                $singleItem = reset($scanned);
                $singleItemPath = $tempExtractDir . '/' . $singleItem;
                if (is_dir($singleItemPath)) {
                    $sourceDir = $singleItemPath;
                }
            }

            // 6. Perform the recursive overlay copy
            // Exclude critical configuration files, user uploads, git archives, and local cache/build artifacts
            $exclusions = [
                '.env',
                '.git',
                'node_modules',
                'storage',
                'bootstrap/cache'
            ];

            $stats = [
                'copied_files' => 0,
                'copied_dirs' => 0
            ];

            $this->recursiveCopy($sourceDir, base_path(), '', $exclusions, $stats);

            // 7. Run database migrations & cache clearing
            $migrationOutput = '';
            $cacheOutput = '';

            try {
                // Run migrations
                Artisan::call('migrate', ['--force' => true]);
                $migrationOutput = Artisan::output();
            } catch (\Exception $me) {
                $migrationOutput = 'Migration Error: ' . $me->getMessage();
            }

            try {
                // Clear all Laravel caches
                Artisan::call('optimize:clear');
                $cacheOutput = Artisan::output();
            } catch (\Exception $ce) {
                $cacheOutput = 'Cache Clearing Error: ' . $ce->getMessage();
            }

            // Clean up extraction folder
            $this->recursiveDelete($tempExtractDir);

            return response()->json([
                'success' => true,
                'message' => 'System updated successfully.',
                'stats' => $stats,
                'migration_output' => $migrationOutput,
                'cache_output' => $cacheOutput
            ]);

        } catch (\Exception $e) {
            // Clean up temp folder in case of error
            $this->recursiveDelete($tempExtractDir);

            return response()->json([
                'success' => false,
                'error' => 'An error occurred during system update: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recursively copy files and directories with exclusions and tracking.
     */
    private function recursiveCopy($src, $dst, $currentRelativePath, $exclusions, &$stats)
    {
        $dir = @opendir($src);
        if (!$dir) {
            return;
        }

        if (!is_dir($dst)) {
            mkdir($dst, 0755, true);
            $stats['copied_dirs']++;
        }

        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $relPath = $currentRelativePath === '' ? $file : $currentRelativePath . '/' . $file;
            
            // Check relative path exclusions
            if (in_array($relPath, $exclusions)) {
                continue;
            }

            $srcFile = $src . '/' . $file;
            $dstFile = $dst . '/' . $file;

            if (is_dir($srcFile)) {
                $this->recursiveCopy($srcFile, $dstFile, $relPath, $exclusions, $stats);
            } else {
                copy($srcFile, $dstFile);
                $stats['copied_files']++;
            }
        }
        closedir($dir);
    }

    /**
     * Recursively delete a directory and its contents.
     */
    private function recursiveDelete($dir)
    {
        if (!is_dir($dir)) {
            return;
        }
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->recursiveDelete($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }
}
