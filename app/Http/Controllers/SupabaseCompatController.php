<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SupabaseCompatController extends Controller
{
    /**
     * Convert ISO 8601 datetime strings and Carbon objects to MySQL-compatible format.
     */
    private function sanitizeDatetimeFields(array $data): array
    {
        $dateColumns = ['created_at', 'updated_at', 'reviewed_at', 'sent_at', 'issued_date', 'start_date', 'end_date', 'deadline'];
        foreach ($data as $key => $val) {
            if ($val === null) continue;
            // Carbon objects => string
            if ($val instanceof \DateTimeInterface) {
                $data[$key] = Carbon::instance($val)->format('Y-m-d H:i:s');
                continue;
            }
            // ISO 8601 strings from JS: "2026-06-17T12:46:00.000Z" => "2026-06-17 12:46:00"
            if (is_string($val) && in_array($key, $dateColumns) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $val)) {
                try {
                    $data[$key] = Carbon::parse($val)->format('Y-m-d H:i:s');
                } catch (\Exception $e) {
                    // leave as-is if parse fails
                }
            }
        }
        return $data;
    }

    private function getModelClass($table)
    {
        $map = [
            'departments' => \App\Models\Department::class,
            'department_skills' => \App\Models\DepartmentSkill::class,
            'application_forms' => \App\Models\ApplicationForm::class,
            'form_fields' => \App\Models\FormField::class,
            'applications' => \App\Models\Application::class,
            'application_responses' => \App\Models\ApplicationResponse::class,
            'profiles' => \App\Models\Profile::class,
            'user_roles' => \App\Models\UserRole::class,
            'interns' => \App\Models\Intern::class,
            'certificates' => \App\Models\Certificate::class,
            'intern_skill_assessments' => \App\Models\InternSkillAssessment::class,
            'staff_assignments' => \App\Models\StaffAssignment::class,
            'nav_menu_items' => \App\Models\NavMenuItem::class,
            'site_settings' => \App\Models\SiteSetting::class,
            'notification_settings' => \App\Models\NotificationSetting::class,
            'notification_templates' => \App\Models\NotificationTemplate::class,
            'notification_logs' => \App\Models\NotificationLog::class,
            'users' => \App\Models\User::class,
            'role_titles' => \App\Models\RoleTitle::class,
        ];
        return $map[$table] ?? null;
    }

    private function getRelationMethod($table, $relationName)
    {
        $map = [
            'application_forms' => [
                'department' => 'department',
                'departments' => 'department',
                'form_fields' => 'formFields',
            ],
            'application_responses' => [
                'application' => 'application',
                'form_fields' => 'formField',
            ],
            'certificates' => [
                'intern' => 'intern',
            ],
            'department_skills' => [
                'department' => 'department',
            ],
            'form_fields' => [
                'form' => 'form',
            ],
            'intern_skill_assessments' => [
                'intern' => 'intern',
                'skill' => 'skill',
            ],
            'interns' => [
                'department' => 'department',
                'user' => 'user',
            ],
            'staff_assignments' => [
                'department' => 'department',
                'departments' => 'department',
                'user' => 'user',
            ],
            'applications' => [
                'application_forms' => 'form',
                'form' => 'form',
                'application_responses' => 'responses',
            ],
        ];

        if (isset($map[$table]) && isset($map[$table][$relationName])) {
            return $map[$table][$relationName];
        }

        // Try mapping by checking if the relation method exists on the model
        $modelClass = $this->getModelClass($table);
        if ($modelClass) {
            $methodsToTry = [
                Str::camel($relationName),
                Str::camel(Str::singular($relationName)),
                Str::camel(Str::plural($relationName)),
            ];

            foreach ($methodsToTry as $method) {
                if (method_exists($modelClass, $method)) {
                    return $method;
                }
            }
        }

        return Str::camel($relationName);
    }

    public function query(Request $request)
    {
        $table = $request->input('table');
        $method = $request->input('method', 'select');
        $selectFields = $request->input('selectFields', '*');
        $insertData = $request->input('insertData');
        $updateData = $request->input('updateData');
        $filters = $request->input('filters', []);
        $orderBy = $request->input('orderBy', []);
        $limit = $request->input('limit');
        $isSingle = $request->input('isSingle', false);
        $isMaybeSingle = $request->input('isMaybeSingle', false);

        $modelClass = $this->getModelClass($table);

        if (!$modelClass) {
            return response()->json([
                'data' => null,
                'error' => "Table [{$table}] not supported by compatibility layer."
            ], 400);
        }

        try {
            $query = $modelClass::query();

            // Apply filters
            foreach ($filters as $filter) {
                $type = $filter['type'];
                $col = $filter['col'];
                $val = $filter['val'];

                // Handle nested relations in filter or direct column
                if ($type === 'eq') {
                    $query->where($col, '=', $val);
                } elseif ($type === 'neq') {
                    $query->where($col, '<>', $val);
                } elseif ($type === 'in') {
                    $query->whereIn($col, (array)$val);
                } elseif ($type === 'lt') {
                    $query->where($col, '<', $val);
                } elseif ($type === 'lte') {
                    $query->where($col, '<=', $val);
                } elseif ($type === 'gt') {
                    $query->where($col, '>', $val);
                } elseif ($type === 'gte') {
                    $query->where($col, '>=', $val);
                } elseif ($type === 'like') {
                    $likeVal = str_replace('*', '%', $val);
                    $query->where($col, 'like', $likeVal);
                }
            }

            // Handle writes
            if ($method === 'insert') {
                if (empty($insertData)) {
                    return response()->json(['data' => null, 'error' => 'No insert data provided'], 400);
                }

                $records = is_array($insertData) && isset($insertData[0]) ? $insertData : [$insertData];
                $created = [];

                foreach ($records as $record) {
                    // Generate ID if missing (since we use UUID primary keys)
                    if (!isset($record['id'])) {
                        $record['id'] = (string) Str::uuid();
                    }

                    // Ensure created_at is set if present in schema
                    if (!isset($record['created_at']) && Schema::hasColumn($table, 'created_at')) {
                        $record['created_at'] = now()->format('Y-m-d H:i:s');
                    }

                    // Sanitize datetime fields
                    $record = $this->sanitizeDatetimeFields($record);

                    // Format JSON fields if needed
                    foreach ($record as $key => $val) {
                        if (is_array($val) || is_object($val)) {
                            $record[$key] = json_encode($val);
                        }
                    }

                    $modelInstance = $modelClass::create($record);
                    $created[] = $modelInstance->fresh();
                }

                $responseData = is_array($insertData) && isset($insertData[0]) ? $created : ($created[0] ?? null);
                return response()->json(['data' => $responseData, 'error' => null]);
            }

            if ($method === 'update') {
                if (empty($updateData)) {
                    return response()->json(['data' => null, 'error' => 'No update data provided'], 400);
                }

                // Sanitize datetime fields for MySQL
                $dataToUpdate = $this->sanitizeDatetimeFields($updateData);

                // Format JSON fields if needed
                foreach ($dataToUpdate as $key => $val) {
                    if (is_array($val) || is_object($val)) {
                        $dataToUpdate[$key] = json_encode($val);
                    }
                }

                // In Supabase, update returns the updated records.
                // We'll perform the update and fetch matching records.
                $query->update($dataToUpdate);
                $updatedRecords = $query->get();

                $responseData = $updatedRecords;
                if ($isSingle || $isMaybeSingle) {
                    $responseData = $updatedRecords->first();
                }
                return response()->json(['data' => $responseData, 'error' => null]);
            }

            if ($method === 'upsert') {
                if (empty($insertData)) {
                    return response()->json(['data' => null, 'error' => 'No upsert data provided'], 400);
                }

                $records = is_array($insertData) && isset($insertData[0]) ? $insertData : [$insertData];
                $onConflictFields = $request->input('onConflictFields');
                
                // Determine the uniqueBy columns
                $uniqueBy = $onConflictFields ? array_map('trim', explode(',', $onConflictFields)) : [];
                if (empty($uniqueBy)) {
                    if ($table === 'site_settings') {
                        $uniqueBy = ['setting_key'];
                    } elseif ($table === 'notification_settings') {
                        $uniqueBy = ['setting_type'];
                    } elseif ($table === 'intern_skill_assessments') {
                        $uniqueBy = ['intern_id', 'skill_id'];
                    } else {
                        $uniqueBy = ['id'];
                    }
                }

                // Prepare records for upsert
                $prepared = [];
                foreach ($records as $record) {
                    // Try to find existing record by unique columns to grab its ID
                    if (!isset($record['id']) && !empty($uniqueBy)) {
                        $existingQuery = DB::table($table);
                        $hasUniqueCols = true;
                        foreach ($uniqueBy as $col) {
                            if (isset($record[$col])) {
                                $existingQuery->where($col, '=', $record[$col]);
                            } else {
                                $hasUniqueCols = false;
                            }
                        }
                        if ($hasUniqueCols) {
                            $existing = $existingQuery->first();
                            if ($existing) {
                                $record['id'] = $existing->id;
                            }
                        }
                    }

                    if (!isset($record['id'])) {
                        $record['id'] = (string) Str::uuid();
                    }
                    if (!isset($record['created_at']) && Schema::hasColumn($table, 'created_at')) {
                        $record['created_at'] = now()->format('Y-m-d H:i:s');
                    }
                    if (Schema::hasColumn($table, 'updated_at')) {
                        $record['updated_at'] = now()->format('Y-m-d H:i:s');
                    }

                    // Sanitize datetime fields for MySQL
                    $record = $this->sanitizeDatetimeFields($record);

                    // Format JSON fields if needed
                    foreach ($record as $key => $val) {
                        if (is_array($val) || is_object($val)) {
                            $record[$key] = json_encode($val);
                        }
                    }
                    $prepared[] = $record;
                }

                // Perform the upsert using the unique primary key ID
                DB::table($table)->upsert($prepared, ['id']);

                // Fetch the updated records to return them
                $fetchQuery = $modelClass::query();
                if (count($prepared) === 1) {
                    $firstRec = $prepared[0];
                    $responseData = $fetchQuery->where('id', '=', $firstRec['id'])->first();
                } else {
                    $ids = array_column($prepared, 'id');
                    $responseData = $fetchQuery->whereIn('id', $ids)->get();
                }

                return response()->json(['data' => $responseData, 'error' => null]);
            }

            if ($method === 'delete') {
                // Fetch records first to return them (Supabase compatibility)
                $recordsToDelete = $query->get();
                $query->delete();
                return response()->json(['data' => $recordsToDelete, 'error' => null]);
            }

            // Handle SELECT
            // Parse relations in selectFields (e.g. "*, department:departments(*)")
            $relationsToLoad = [];
            $aliasMapping = [];

            if ($selectFields !== '*') {
                // Split by comma but respect brackets
                $parts = preg_split('/,(?![^(]*\))/', $selectFields);
                foreach ($parts as $part) {
                    $part = trim($part);
                    // Match "alias:relation(*)" or "relation(*)"
                    if (preg_match('/^([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)\((.*)\)$/', $part, $matches)) {
                        $alias = $matches[1];
                        $relationName = $matches[2];
                        $relationMethod = $this->getRelationMethod($table, $relationName);
                        $relationsToLoad[] = $relationMethod;
                        $aliasMapping[$relationMethod] = $alias;
                    } elseif (preg_match('/^([a-zA-Z0-9_]+)\((.*)\)$/', $part, $matches)) {
                        $relationName = $matches[1];
                        $relationMethod = $this->getRelationMethod($table, $relationName);
                        $relationsToLoad[] = $relationMethod;
                        $aliasMapping[$relationMethod] = $relationName;
                    }
                }
            }

            if (!empty($relationsToLoad)) {
                $query->with($relationsToLoad);
            }

            // Apply ordering
            foreach ($orderBy as $order) {
                $query->orderBy($order['col'], $order['ascending'] ? 'asc' : 'desc');
            }

            // Apply limits
            if ($limit) {
                $query->limit($limit);
            }

            $count = null;
            if ($request->input('countOption') || $request->input('headOption')) {
                // Clone the query to get count without applying limits or fetching
                $count = (clone $query)->count();
            }

            if ($request->input('headOption', false)) {
                return response()->json(['data' => null, 'count' => $count, 'error' => null]);
            }

            // Get result
            if ($isSingle) {
                $data = $query->firstOrFail();
            } elseif ($isMaybeSingle) {
                $data = $query->first();
            } else {
                $data = $query->get();
            }

            // Alias relations to match client expectations
            if ($data) {
                $records = ($isSingle || $isMaybeSingle) ? [$data] : $data;
                foreach ($records as $record) {
                    foreach ($aliasMapping as $relationMethod => $alias) {
                        if ($record->relationLoaded($relationMethod)) {
                            // Copy relation object to the alias key
                            $record->setAttribute($alias, $record->getRelation($relationMethod));
                        }
                    }
                }
            }

            return response()->json(['data' => $data, 'count' => $count, 'error' => null]);

        } catch (\Exception $e) {
            return response()->json([
                'data' => null,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
