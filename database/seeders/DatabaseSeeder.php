<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\SiteSetting;
use App\Models\NotificationSetting;
use App\Models\NotificationTemplate;
use App\Models\Department;
use App\Models\DepartmentSkill;
use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default Admin user
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@digi5.com'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Digi5 Admin',
                'password' => Hash::make('password'),
            ]
        );

        Profile::updateOrCreate(
            ['user_id' => $adminUser->id],
            [
                'id' => (string) Str::uuid(),
                'email' => 'admin@digi5.com',
                'full_name' => 'Digi5 Admin',
            ]
        );

        UserRole::updateOrCreate(
            ['user_id' => $adminUser->id, 'role' => 'admin'],
            [
                'id' => (string) Str::uuid(),
                'created_at' => now(),
            ]
        );

        // 1. Seed Site Settings
        $siteSettings = [
            ['setting_key' => 'company_logo_url', 'setting_value' => null],
            ['setting_key' => 'signature_url', 'setting_value' => null],
            ['setting_key' => 'favicon_url', 'setting_value' => null],
            ['setting_key' => 'certificate_pattern_enabled', 'setting_value' => 'false'],
            ['setting_key' => 'certificate_pattern_url', 'setting_value' => null],
            ['setting_key' => 'certificate_pattern_opacity', 'setting_value' => '5'],
        ];

        foreach ($siteSettings as $setting) {
            SiteSetting::updateOrCreate(
                ['setting_key' => $setting['setting_key']],
                ['setting_value' => $setting['setting_value']]
            );
        }

        // 2. Seed Notification Settings
        NotificationSetting::updateOrCreate(
            ['setting_type' => 'smtp'],
            [
                'is_enabled' => false,
                'config' => [
                    'provider' => 'resend',
                    'from_email' => '',
                    'from_name' => 'DIGI5 LTD',
                ],
                'test_mode' => false,
            ]
        );

        NotificationSetting::updateOrCreate(
            ['setting_type' => 'sms'],
            [
                'is_enabled' => false,
                'config' => [
                    'provider' => 'sms.net.bd',
                    'sender_id' => '',
                    'api_key' => '',
                ],
                'test_mode' => false,
            ]
        );

        // 3. Seed Notification Templates
        $templates = [
            [
                'template_key' => 'application_submitted',
                'template_type' => 'email',
                'name' => 'Application Submitted',
                'subject' => 'Application Received - {{form_title}}',
                'body_template' => "Dear {{applicant_name}},\n\nThank you for submitting your application for {{form_title}} at DIGI5 LTD.\n\nWe have received your application and our team will review it shortly. You will be notified once your application status is updated.\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => true
            ],
            [
                'template_key' => 'application_status_changed',
                'template_type' => 'email',
                'name' => 'Application Status Changed',
                'subject' => 'Application Update - {{form_title}}',
                'body_template' => "Dear {{applicant_name}},\n\nYour application for {{form_title}} has been updated.\n\nNew Status: {{application_status}}\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => true
            ],
            [
                'template_key' => 'certificate_issued',
                'template_type' => 'email',
                'name' => 'Certificate Issued',
                'subject' => '🎉 Your Certificate is Ready - {{certificate_id}}',
                'body_template' => "Dear {{intern_name}},\n\nCongratulations! Your internship certificate has been issued.\n\nCertificate ID: {{certificate_id}}\nDepartment: {{department_name}}\nRole: {{role_title}}\n\nVerify your certificate at: {{verification_url}}\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => true
            ],
            [
                'template_key' => 'certificate_revoked',
                'template_type' => 'email',
                'name' => 'Certificate Revoked',
                'subject' => 'Certificate Status Update - {{certificate_id}}',
                'body_template' => "Dear {{intern_name}},\n\nWe regret to inform you that your certificate (ID: {{certificate_id}}) has been revoked.\n\nIf you believe this is an error, please contact our administration team.\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => true
            ],
            [
                'template_key' => 'application_submitted',
                'template_type' => 'sms',
                'name' => 'Application Submitted',
                'subject' => null,
                'body_template' => "Dear {{applicant_name}}, your application for {{form_title}} at DIGI5 LTD has been received. We will notify you of any updates.",
                'is_enabled' => true
            ],
            [
                'template_key' => 'application_status_changed',
                'template_type' => 'sms',
                'name' => 'Application Status Changed',
                'subject' => null,
                'body_template' => "Hi {{applicant_name}}, your application for {{form_title}} status: {{application_status}}. - DIGI5 LTD",
                'is_enabled' => true
            ],
            [
                'template_key' => 'certificate_issued',
                'template_type' => 'sms',
                'name' => 'Certificate Issued',
                'subject' => null,
                'body_template' => "Congratulations {{intern_name}}! Your DIGI5 certificate ({{certificate_id}}) is ready. Verify: {{verification_url}}",
                'is_enabled' => true
            ],
            [
                'template_key' => 'certificate_revoked',
                'template_type' => 'sms',
                'name' => 'Certificate Revoked',
                'subject' => null,
                'body_template' => "Hi {{intern_name}}, your certificate {{certificate_id}} has been revoked. Contact admin for details. - DIGI5 LTD",
                'is_enabled' => true
            ],
        ];

        foreach ($templates as $t) {
            NotificationTemplate::updateOrCreate(
                ['template_key' => $t['template_key'], 'template_type' => $t['template_type']],
                [
                    'name' => $t['name'],
                    'subject' => $t['subject'],
                    'body_template' => $t['body_template'],
                    'is_enabled' => $t['is_enabled'],
                ]
            );
        }

        // 4. Seed Departments and Skills
        $departments = [
            'Frontend Development' => [
                'desc' => 'Web frontend development using modern frameworks',
                'skills' => [
                    ['name' => 'HTML & CSS', 'desc' => 'Markup and styling fundamentals', 'order' => 1],
                    ['name' => 'JavaScript/TypeScript', 'desc' => 'Core programming languages', 'order' => 2],
                    ['name' => 'React/Vue/Angular', 'desc' => 'Modern frontend frameworks', 'order' => 3],
                    ['name' => 'Responsive Design', 'desc' => 'Mobile-first and adaptive layouts', 'order' => 4],
                    ['name' => 'UI/UX Implementation', 'desc' => 'Translating designs to code', 'order' => 5],
                ]
            ],
            'Backend Development' => [
                'desc' => 'Server-side development and API design',
                'skills' => [
                    ['name' => 'Node.js/Python', 'desc' => 'Server-side programming', 'order' => 1],
                    ['name' => 'Database Management', 'desc' => 'SQL and NoSQL databases', 'order' => 2],
                    ['name' => 'API Development', 'desc' => 'REST and GraphQL APIs', 'order' => 3],
                    ['name' => 'Security Best Practices', 'desc' => 'Authentication and authorization', 'order' => 4],
                    ['name' => 'Cloud Services', 'desc' => 'AWS, GCP, or Azure', 'order' => 5],
                ]
            ],
            'Graphic Design' => [
                'desc' => 'Visual design and brand identity',
                'skills' => [
                    ['name' => 'Adobe Photoshop', 'desc' => 'Image editing and manipulation', 'order' => 1],
                    ['name' => 'Adobe Illustrator', 'desc' => 'Vector graphics and illustrations', 'order' => 2],
                    ['name' => 'UI/UX Design', 'desc' => 'User interface and experience design', 'order' => 3],
                    ['name' => 'Brand Identity', 'desc' => 'Logo and brand guidelines', 'order' => 4],
                    ['name' => 'Typography', 'desc' => 'Font selection and text layout', 'order' => 5],
                ]
            ],
            'Digital Marketing' => [
                'desc' => 'Online marketing and growth strategies',
                'skills' => [
                    ['name' => 'SEO/SEM', 'desc' => 'Search engine optimization and marketing', 'order' => 1],
                    ['name' => 'Social Media Marketing', 'desc' => 'Platform-specific strategies', 'order' => 2],
                    ['name' => 'Content Strategy', 'desc' => 'Content planning and creation', 'order' => 3],
                    ['name' => 'Analytics & Reporting', 'desc' => 'Data analysis and insights', 'order' => 4],
                    ['name' => 'Email Marketing', 'desc' => 'Campaign management and automation', 'order' => 5],
                ]
            ],
            'Video Editing' => [
                'desc' => 'Video production and post-processing',
                'skills' => [
                    ['name' => 'Premiere Pro/Final Cut', 'desc' => 'Professional editing software', 'order' => 1],
                    ['name' => 'Motion Graphics', 'desc' => 'After Effects and animations', 'order' => 2],
                    ['name' => 'Color Grading', 'desc' => 'Color correction and styling', 'order' => 3],
                    ['name' => 'Sound Design', 'desc' => 'Audio editing and mixing', 'order' => 4],
                    ['name' => 'Storytelling', 'desc' => 'Narrative structure and pacing', 'order' => 5],
                ]
            ],
            'Automation & RPA' => [
                'desc' => 'Process automation and robotic process automation',
                'skills' => [
                    ['name' => 'Python Scripting', 'desc' => 'Automation scripts and tools', 'order' => 1],
                    ['name' => 'RPA Tools', 'desc' => 'RPA tools like UiPath or Automation Anywhere', 'order' => 2],
                    ['name' => 'API Integration', 'desc' => 'Connecting systems via APIs', 'order' => 3],
                    ['name' => 'Workflow Design', 'desc' => 'Process mapping and optimization', 'order' => 4],
                    ['name' => 'Testing & QA', 'desc' => 'Quality assurance and testing', 'order' => 5],
                ]
            ],
        ];

        foreach ($departments as $name => $data) {
            $dept = Department::updateOrCreate(
                ['name' => $name],
                ['description' => $data['desc']]
            );

            foreach ($data['skills'] as $skill) {
                DepartmentSkill::updateOrCreate(
                    ['department_id' => $dept->id, 'skill_name' => $skill['name']],
                    [
                        'skill_description' => $skill['desc'],
                        'display_order' => $skill['order'],
                    ]
                );
            }
        }
    }
}
