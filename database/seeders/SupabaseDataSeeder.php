<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupabaseDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $filePath = base_path('../db_cluster-21-12-2025@14-06-53.backup');
        if (!file_exists($filePath)) {
            $this->command->error("Backup file not found at: {$filePath}");
            return;
        }

        $this->command->info("Parsing PostgreSQL backup file...");

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->command->error("Failed to open backup file.");
            return;
        }

        $currentTable = null;
        $currentColumns = [];
        $tableData = [];

        while (($line = fgets($handle)) !== false) {
            $line = rtrim($line, "\r\n");

            // Look for COPY statement: e.g. COPY public.profiles (id, user_id, ...) FROM stdin;
            if (preg_match('/^COPY\s+([a-zA-Z0-9_\.]+)\s*\((.*?)\)\s*FROM\s+stdin;/i', $line, $matches)) {
                $tableName = $matches[1];
                $columns = array_map(function($col) {
                    return trim($col, ' "');
                }, explode(',', $matches[2]));

                $currentTable = $tableName;
                $currentColumns = $columns;
                $tableData[$currentTable] = [];
                continue;
            }

            // Look for end of COPY block
            if ($line === '\.') {
                $currentTable = null;
                $currentColumns = [];
                continue;
            }

            // If we are currently parsing a table block
            if ($currentTable !== null) {
                $vals = explode("\t", $line);
                $row = [];
                foreach ($currentColumns as $index => $colName) {
                    $val = isset($vals[$index]) ? $vals[$index] : null;
                    if ($val === '\N') {
                        $val = null;
                    } else if ($val !== null) {
                        // Unescape pg_dump C-style escapes
                        $val = str_replace(
                            ['\\t', '\\n', '\\r', '\\\\'],
                            ["\t", "\n", "\r", "\\"],
                            $val
                        );
                    }
                    $row[$colName] = $val;
                }
                $tableData[$currentTable][] = $row;
            }
        }
        fclose($handle);

        $this->command->info("Finished parsing. Preparing inserts into MySQL...");

        // Disable foreign key checks to avoid insert order issues
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Helper to normalize single values
        $booleanFields = ['is_active', 'is_required', 'is_enabled', 'is_external', 'test_mode'];
        $normalizeVal = function($val, $isBoolean = false) {
            if ($val === null) {
                return null;
            }
            if ($isBoolean) {
                if ($val === 't') return 1;
                if ($val === 'f') return 0;
            }
            if (is_string($val) && preg_match('/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/', $val)) {
                if (preg_match('/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/', $val, $matches)) {
                    return $matches[1];
                }
            }
            return $val;
        };

        $normalizeRow = function($row) use ($booleanFields, $normalizeVal) {
            foreach ($row as $key => $val) {
                $isBool = in_array($key, $booleanFields);
                $row[$key] = $normalizeVal($val, $isBool);
            }
            return $row;
        };

        // 1. Migrate auth.users -> users
        if (isset($tableData['auth.users'])) {
            $this->command->info("Migrating auth.users -> users (" . count($tableData['auth.users']) . " records)...");
            DB::table('users')->truncate();
            $users = [];
            foreach ($tableData['auth.users'] as $u) {
                // Determine user's name
                $name = 'User';
                if (!empty($u['raw_user_meta_data'])) {
                    $meta = json_decode($u['raw_user_meta_data'], true);
                    if (!empty($meta['full_name'])) {
                        $name = $meta['full_name'];
                    } elseif (!empty($meta['name'])) {
                        $name = $meta['name'];
                    } else {
                        $name = explode('@', $u['email'])[0];
                    }
                }
                
                $users[] = [
                    'id' => $u['id'],
                    'name' => $name,
                    'email' => $u['email'],
                    'email_verified_at' => $normalizeVal($u['email_confirmed_at'] ?? null),
                    'password' => $u['encrypted_password'], // password hash matches bcrypt
                    'created_at' => $normalizeVal($u['created_at']),
                    'updated_at' => $normalizeVal($u['updated_at']),
                ];
            }
            
            DB::table('users')->insert($users);
        }

        // 2. Migrate public.* tables
        $mappings = [
            'public.profiles' => 'profiles',
            'public.user_roles' => 'user_roles',
            'public.departments' => 'departments',
            'public.department_skills' => 'department_skills',
            'public.application_forms' => 'application_forms',
            'public.form_fields' => 'form_fields',
            'public.applications' => 'applications',
            'public.application_responses' => 'application_responses',
            'public.interns' => 'interns',
            'public.certificates' => 'certificates',
            'public.intern_skill_assessments' => 'intern_skill_assessments',
            'public.staff_assignments' => 'staff_assignments',
            'public.nav_menu_items' => 'nav_menu_items',
            'public.site_settings' => 'site_settings',
            'public.notification_settings' => 'notification_settings',
            'public.notification_templates' => 'notification_templates',
            'public.notification_logs' => 'notification_logs',
        ];

        foreach ($mappings as $pgTable => $myTable) {
            if (isset($tableData[$pgTable])) {
                $count = count($tableData[$pgTable]);
                $this->command->info("Migrating {$pgTable} -> {$myTable} ({$count} records)...");
                DB::table($myTable)->truncate();

                if ($count === 0) {
                    continue;
                }

                $records = [];
                foreach ($tableData[$pgTable] as $row) {
                    // Normalize boolean values
                    $row = $normalizeRow($row);

                    // Custom table adjustments
                    if ($myTable === 'interns') {
                        $row['phone'] = null;
                    }

                    $records[] = $row;
                }

                // Batch insert in chunks of 100
                $chunks = array_chunk($records, 100);
                foreach ($chunks as $chunk) {
                    DB::table($myTable)->insert($chunk);
                }
            } else {
                $this->command->warn("Table data for {$pgTable} not found in the backup file.");
            }
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->command->info("Database migration completed successfully!");
    }
}
