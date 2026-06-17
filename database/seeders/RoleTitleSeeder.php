<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleTitleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Software Engineer Intern',
            'Frontend Developer Intern',
            'Backend Developer Intern',
            'UI/UX Design Intern',
            'Digital Marketing Intern',
            'Data Analyst Intern',
            'Project Manager Intern',
            'Quality Assurance Intern'
        ];

        foreach ($roles as $role) {
            \App\Models\RoleTitle::updateOrCreate(['title' => $role]);
        }
    }
}
