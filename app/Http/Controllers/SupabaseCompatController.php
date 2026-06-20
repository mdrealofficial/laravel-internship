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
     * Convert ISO 8601 datetime strings, Carbon objects, and booleans to MySQL-compatible formats.
     */
    private function sanitizePayload(array $data): array
    {
        $dateColumns = ['created_at', 'updated_at', 'reviewed_at', 'sent_at', 'issued_date', 'start_date', 'end_date', 'deadline', 'interview_scheduled_at'];
        foreach ($data as $key => $val) {
            if ($val === null) continue;

            // Explicitly cast booleans to integers (1 or 0) for direct DB queries
            if (is_bool($val)) {
                $data[$key] = $val ? 1 : 0;
                continue;
            }

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
            'unsubscribed_emails' => \App\Models\UnsubscribedEmail::class,
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
                'department' => 'department',
                'departments' => 'department',
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

    private function resolveRelationsAndAliases($table, $selectFields, &$relationsToLoad, &$aliasMapping, $parentRelationPath = '', $parentModelClass = null)
    {
        $len = strlen($selectFields);
        $i = 0;
        
        while ($i < $len) {
            if ($selectFields[$i] === ' ' || $selectFields[$i] === ',') {
                $i++;
                continue;
            }
            
            $start = $i;
            $parenCount = 0;
            $relationStr = '';
            
            while ($i < $len) {
                if ($selectFields[$i] === '(') {
                    $parenCount++;
                    if ($parenCount === 1) {
                        $relationStr = substr($selectFields, $start, $i - $start);
                        $start = $i + 1;
                    }
                } elseif ($selectFields[$i] === ')') {
                    $parenCount--;
                    if ($parenCount === 0) {
                        $innerContent = substr($selectFields, $start, $i - $start);
                        
                        $relationStr = trim($relationStr);
                        $parts = explode(':', $relationStr);
                        $relationName = count($parts) > 1 ? $parts[1] : $parts[0];
                        $alias = $parts[0];
                        
                        $relationName = trim($relationName);
                        $alias = trim($alias);
                        
                        // Get the current model's relation method name
                        $currentTable = $parentModelClass ? (new $parentModelClass)->getTable() : $table;
                        $relationMethod = $this->getRelationMethod($currentTable, $relationName);
                        
                        // Build Eloquent with() path (e.g. "form.department")
                        $withPath = $parentRelationPath ? $parentRelationPath . '.' . $relationMethod : $relationMethod;
                        $relationsToLoad[] = $withPath;
                        
                        $aliasMapping[$withPath] = [
                            'alias' => $alias,
                            'relationMethod' => $relationMethod,
                            'parentPath' => $parentRelationPath
                        ];
                        
                        // Recurse into inner content
                        $modelClass = $parentModelClass ?: $this->getModelClass($table);
                        if ($modelClass && method_exists($modelClass, $relationMethod)) {
                            try {
                                $relatedModelClass = get_class((new $modelClass)->$relationMethod()->getRelated());
                                $this->resolveRelationsAndAliases(
                                    $table,
                                    $innerContent,
                                    $relationsToLoad,
                                    $aliasMapping,
                                    $withPath,
                                    $relatedModelClass
                                );
                            } catch (\Exception $e) {
                                // Ignore recursion errors on dynamic relations
                            }
                        }
                        
                        break;
                    }
                }
                $i++;
            }
            $i++;
        }
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

                    // Sanitize payload for MySQL
                    $record = $this->sanitizePayload($record);

                    // Format JSON fields if needed
                    $modelInstance = new $modelClass;
                    foreach ($record as $key => $val) {
                        if (is_array($val) || is_object($val)) {
                            if (!$modelInstance->hasCast($key, ['json', 'array', 'object', 'collection', 'encrypted:json', 'encrypted:array', 'encrypted:object', 'encrypted:collection'])) {
                                $record[$key] = json_encode($val);
                            }
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

                // Sanitize payload for MySQL
                $dataToUpdate = $this->sanitizePayload($updateData);

                // Format JSON fields if needed
                $modelInstance = new $modelClass;
                foreach ($dataToUpdate as $key => $val) {
                    if (is_array($val) || is_object($val)) {
                        if (!$modelInstance->hasCast($key, ['json', 'array', 'object', 'collection', 'encrypted:json', 'encrypted:array', 'encrypted:object', 'encrypted:collection'])) {
                            $dataToUpdate[$key] = json_encode($val);
                        }
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

                    // Sanitize payload for MySQL
                    $record = $this->sanitizePayload($record);

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
                $this->resolveRelationsAndAliases($table, $selectFields, $relationsToLoad, $aliasMapping);
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
            if ($data && !empty($aliasMapping)) {
                $records = ($isSingle || $isMaybeSingle) ? [$data] : $data;
                foreach ($records as $record) {
                    foreach ($aliasMapping as $withPath => $mapping) {
                        $alias = $mapping['alias'];
                        $relationMethod = $mapping['relationMethod'];
                        $parentPath = $mapping['parentPath'];
                        
                        // Retrieve the parent object(s)
                        $parents = [$record];
                        if (!empty($parentPath)) {
                            $pathParts = explode('.', $parentPath);
                            foreach ($pathParts as $part) {
                                $nextParents = [];
                                foreach ($parents as $p) {
                                    if ($p && $p->relationLoaded($part)) {
                                        $rel = $p->getRelation($part);
                                        if ($rel instanceof \Illuminate\Database\Eloquent\Collection) {
                                            foreach ($rel as $item) {
                                                $nextParents[] = $item;
                                            }
                                        } elseif ($rel) {
                                            $nextParents[] = $rel;
                                        }
                                    }
                                }
                                $parents = $nextParents;
                            }
                        }
                        
                        // Set the alias on the parent objects
                        foreach ($parents as $parentObj) {
                            if ($parentObj && $parentObj->relationLoaded($relationMethod)) {
                                $parentObj->setAttribute($alias, $parentObj->getRelation($relationMethod));
                            }
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
