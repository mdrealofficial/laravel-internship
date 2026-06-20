import { supabase } from '@/integrations/supabase/client';
import { ApplicationForm, FormField } from '@/types/database';

// A helper list of mock names, emails, and phones
const MOCK_CANDIDATES = [
  { name: 'Sarah Connor', email: 'sarah.connor@example.com', phone: '+15550101' },
  { name: 'John Connor', email: 'john.connor@example.com', phone: '+15550102' },
  { name: 'Bruce Wayne', email: 'bruce.wayne@example.com', phone: '+15550103' },
  { name: 'Clark Kent', email: 'clark.kent@example.com', phone: '+15550104' },
  { name: 'Peter Parker', email: 'peter.parker@example.com', phone: '+15550105' },
  { name: 'Tony Stark', email: 'tony.stark@example.com', phone: '+15550106' },
  { name: 'Natasha Romanoff', email: 'natasha.romanoff@example.com', phone: '+15550107' },
  { name: 'Steve Rogers', email: 'steve.rogers@example.com', phone: '+15550108' },
  { name: 'Diana Prince', email: 'diana.prince@example.com', phone: '+15550109' },
  { name: 'Barry Allen', email: 'barry.allen@example.com', phone: '+15550110' },
];

export async function generateMockApplication(form: ApplicationForm) {
  // 1. Fetch form fields
  const { data: fields, error: fieldsError } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', form.id)
    .order('display_order');

  if (fieldsError || !fields) {
    throw new Error('Failed to load fields for this form.');
  }

  // 2. Fetch Gemini API Key
  const { data: apiKeyData } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .eq('setting_key', 'gemini_api_key')
    .maybeSingle();

  const geminiApiKey = apiKeyData?.setting_value;

  // Choose a department id
  let selectedDepartmentId: string | null = form.department_id || null;
  if (form.is_multi_department && form.allowed_departments && form.allowed_departments.length > 0) {
    const randomDeptIndex = Math.floor(Math.random() * form.allowed_departments.length);
    selectedDepartmentId = form.allowed_departments[randomDeptIndex];
  }

  let generatedData: {
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string | null;
    responses: Record<string, string | string[]>;
  };

  if (geminiApiKey) {
    try {
      generatedData = await generateWithGemini(form, fields, geminiApiKey);
    } catch (e) {
      console.warn('Gemini generation failed, falling back to local mock generator:', e);
      generatedData = generateLocalFallback(form, fields, selectedDepartmentId);
    }
  } else {
    generatedData = generateLocalFallback(form, fields, selectedDepartmentId);
  }

  // 3. Load department skills if multi department is enabled
  let allDepartmentSkills: any[] = [];
  if (form.is_multi_department) {
    const { data: deptSkillsData } = await supabase
      .from('department_skills')
      .select('*')
      .order('display_order');
    allDepartmentSkills = deptSkillsData || [];
  }

  // 4. Calculate skill score
  let skillScore: number | null = null;
  const skillsField = fields.find((f) => f.field_type === 'skills');
  if (skillsField) {
    try {
      let config: any = null;
      if (skillsField.options) {
        const raw = Array.isArray(skillsField.options) ? skillsField.options[0] : skillsField.options;
        if (raw) {
          config = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
      }
      
      // If generated response is a string, split it to an array
      let selectedNames: string[] = [];
      const rawResponseVal = generatedData.responses[skillsField.id];
      if (Array.isArray(rawResponseVal)) {
        selectedNames = rawResponseVal;
      } else if (typeof rawResponseVal === 'string') {
        selectedNames = rawResponseVal.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (form.is_multi_department) {
        const configSkillsForDept = selectedDepartmentId && config?.departments?.[selectedDepartmentId];

        if (configSkillsForDept && Array.isArray(configSkillsForDept)) {
          let earnedPoints = 0;
          let totalPossiblePoints = 0;
          
          configSkillsForDept.forEach((s: any) => {
            if (s.enabled) {
              totalPossiblePoints += Number(s.points) || 0;
              if (selectedNames.includes(s.name)) {
                earnedPoints += Number(s.points) || 0;
              }
            }
          });

          if (totalPossiblePoints > 0) {
            skillScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
          } else {
            skillScore = 0;
          }
        } else {
          const deptSkills = allDepartmentSkills.filter(s => s.department_id === selectedDepartmentId);
          if (deptSkills.length > 0) {
            const selectedCount = deptSkills.filter(s => selectedNames.includes(s.skill_name)).length;
            skillScore = Math.round((selectedCount / deptSkills.length) * 100);
          } else {
            skillScore = 0;
          }
        }
      } else {
        if (config && config.skills) {
          let earnedPoints = 0;
          let totalPossiblePoints = 0;
          
          config.skills.forEach((s: any) => {
            if (s.enabled) {
              totalPossiblePoints += Number(s.points) || 0;
              if (selectedNames.includes(s.name)) {
                earnedPoints += Number(s.points) || 0;
              }
            }
          });

          if (totalPossiblePoints > 0) {
            skillScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
          } else {
            skillScore = 0;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse skills configuration during score calculation:', e);
    }
  }

  // 5. Auto-screening status transition
  let initialStatus = 'submitted';
  if (form.auto_screening && typeof form.auto_screening === 'object') {
    const rules = form.auto_screening as any;
    if (rules.enabled) {
      const threshold = Number(rules.minScore) || 0;
      const currentScore = skillScore ?? 0;
      if (currentScore >= threshold) {
        initialStatus = rules.passStatus || 'shortlisted';
      } else {
        initialStatus = rules.failStatus || 'rejected';
      }
    }
  }

  // 6. Insert Application
  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      form_id: form.id,
      form_type: 'job',
      department_id: selectedDepartmentId,
      applicant_name: generatedData.applicant_name,
      applicant_email: generatedData.applicant_email,
      applicant_phone: generatedData.applicant_phone,
      skill_score: skillScore,
      status: initialStatus,
    })
    .select()
    .single();

  if (appError) {
    throw appError;
  }

  // 7. Insert Responses
  const responseInserts = fields.map((field) => {
    let val = generatedData.responses[field.id];
    let stringVal = Array.isArray(val) ? val.join(', ') : (val || null);

    if (field.field_type === 'range' && stringVal === null) {
      stringVal = field.options?.[0] || '0';
    }

    return {
      application_id: application.id,
      field_id: field.id,
      response_value: stringVal,
      file_url: field.field_type === 'file' ? stringVal : null,
    };
  });

  const { error: respError } = await supabase.from('application_responses').insert(responseInserts);
  if (respError) {
    throw respError;
  }

  // 8. Send Notification
  let deliveryStatus = 'failed';
  try {
    const { data: notifyData } = await supabase.functions.invoke('send-notification', {
      body: {
        template_key: 'job_application_submitted',
        recipient_email: generatedData.applicant_email,
        recipient_phone: generatedData.applicant_phone,
        data: {
          applicant_name: generatedData.applicant_name,
          form_title: form.title,
        },
      },
    });

    if (notifyData && notifyData.success) {
      const emailSuccess = notifyData.results?.email?.success;
      const smsSuccess = notifyData.results?.sms?.success;
      if (emailSuccess && smsSuccess) {
        deliveryStatus = 'sent (Email & SMS)';
      } else if (emailSuccess) {
        deliveryStatus = 'sent (Email)';
      } else if (smsSuccess) {
        deliveryStatus = 'sent (SMS)';
      } else {
        deliveryStatus = 'sent';
      }
    }
  } catch (notifyErr) {
    console.error('Failed to send notification:', notifyErr);
  }

  await supabase
    .from('applications')
    .update({ delivery_status: deliveryStatus })
    .eq('id', application.id);

  // Auto-screening status transition notification
  if (initialStatus !== 'submitted') {
    try {
      let templateKey = 'job_application_status_changed';
      if (initialStatus === 'approved') templateKey = 'job_application_approved';
      else if (initialStatus === 'rejected') templateKey = 'job_application_rejected';
      else if (initialStatus === 'shortlisted') templateKey = 'job_application_shortlisted';
      else if (initialStatus === 'reviewing') templateKey = 'job_application_reviewing';

      await supabase.functions.invoke('send-notification', {
        body: {
          template_key: templateKey,
          recipient_email: generatedData.applicant_email,
          recipient_phone: generatedData.applicant_phone,
          data: {
            applicant_name: generatedData.applicant_name,
            form_title: form.title,
            status: initialStatus,
            position: form.title,
            admin_notes: 'Auto-screened by system rules',
            company_name: 'DIGI5 LTD',
          }
        }
      });
    } catch (screenNotifyErr) {
      console.error('Failed to send auto-screening notification:', screenNotifyErr);
    }
  }

  return application;
}

// Local Fallback Generator
function generateLocalFallback(
  form: ApplicationForm,
  fields: FormField[],
  selectedDepartmentId: string | null
) {
  const candidate = MOCK_CANDIDATES[Math.floor(Math.random() * MOCK_CANDIDATES.length)];
  // Add a random number to the email so it's unique
  const randNum = Math.floor(Math.random() * 900) + 100;
  const emailParts = candidate.email.split('@');
  const uniqueEmail = `${emailParts[0]}${randNum}@${emailParts[1]}`;

  const responses: Record<string, string | string[]> = {};

  fields.forEach((field) => {
    if (field.field_type === 'text' || field.field_type === 'textarea') {
      const lowerLabel = field.label.toLowerCase();
      if (lowerLabel.includes('experience') || lowerLabel.includes('year')) {
        responses[field.id] = 'I have about 3-4 years of experience working in similar roles, handling core responsibilities efficiently.';
      } else if (lowerLabel.includes('why') || lowerLabel.includes('reason') || lowerLabel.includes('motivate')) {
        responses[field.id] = `I am highly motivated to join DIGI5 LTD as a ${form.title}. The company's culture and standard align perfectly with my long term career goals.`;
      } else if (lowerLabel.includes('linkedin') || lowerLabel.includes('portfolio') || lowerLabel.includes('url') || lowerLabel.includes('link')) {
        responses[field.id] = 'https://linkedin.com/in/mock-candidate-' + randNum;
      } else if (lowerLabel.includes('address') || lowerLabel.includes('city')) {
        responses[field.id] = 'London, United Kingdom';
      } else {
        responses[field.id] = `This is my response for ${field.label}. I possess strong capabilities in this aspect.`;
      }
    } else if (field.field_type === 'select' || field.field_type === 'radio') {
      if (field.options && field.options.length > 0) {
        responses[field.id] = field.options[Math.floor(Math.random() * field.options.length)];
      } else {
        responses[field.id] = '';
      }
    } else if (field.field_type === 'checkbox') {
      if (field.options && field.options.length > 0) {
        // pick 1 to 2 options
        const count = Math.min(2, field.options.length);
        const shuffled = [...field.options].sort(() => 0.5 - Math.random());
        responses[field.id] = shuffled.slice(0, count);
      } else {
        responses[field.id] = [];
      }
    } else if (field.field_type === 'file') {
      responses[field.id] = `resume_candidate_${randNum}.pdf`;
    } else if (field.field_type === 'date') {
      responses[field.id] = '2026-06-20';
    } else if (field.field_type === 'number') {
      responses[field.id] = String(Math.floor(Math.random() * 5) + 1);
    } else if (field.field_type === 'range') {
      responses[field.id] = field.options?.[0] || '5';
    } else if (field.field_type === 'skills') {
      try {
        let config: any = null;
        if (field.options) {
          const raw = Array.isArray(field.options) ? field.options[0] : field.options;
          if (raw) {
            config = typeof raw === 'string' ? JSON.parse(raw) : raw;
          }
        }
        let skillNames: string[] = [];
        if (form.is_multi_department && selectedDepartmentId && config?.departments?.[selectedDepartmentId]) {
          const deptSkills = config.departments[selectedDepartmentId];
          if (Array.isArray(deptSkills)) {
            skillNames = deptSkills.filter((s: any) => s.enabled).map((s: any) => s.name);
          }
        } else if (config && Array.isArray(config.skills)) {
          skillNames = config.skills.filter((s: any) => s.enabled).map((s: any) => s.name);
        }

        if (skillNames.length > 0) {
          // Select 60-90% of the skills randomly to have varying scores
          const percent = 0.6 + Math.random() * 0.3;
          const selectCount = Math.max(1, Math.round(skillNames.length * percent));
          const shuffled = [...skillNames].sort(() => 0.5 - Math.random());
          responses[field.id] = shuffled.slice(0, selectCount);
        } else {
          responses[field.id] = [];
        }
      } catch (e) {
        console.error('Failed to generate mock skills:', e);
        responses[field.id] = [];
      }
    }
  });

  return {
    applicant_name: `${candidate.name}`,
    applicant_email: uniqueEmail,
    applicant_phone: candidate.phone,
    responses,
  };
}

// Generate with Gemini
async function generateWithGemini(form: ApplicationForm, fields: FormField[], geminiApiKey: string) {
  // Construct a prompt summarizing the fields and the position.
  const fieldsPrompt = fields.map((f) => {
    return {
      id: f.id,
      label: f.label,
      field_type: f.field_type,
      options: f.options,
      is_required: f.is_required
    };
  });

  const prompt = `You are a helper tool seeder for a job recruitment portal.
Generate a highly realistic job candidate profile and their custom form field responses for the position: "${form.title}".
Job Description: "${form.description || ''}"

Form fields:
${JSON.stringify(fieldsPrompt, null, 2)}

Requirements for output:
1. Provide a single JSON object.
2. The JSON object must strictly match this structure:
{
  "applicant_name": "Full Name",
  "applicant_email": "name.email@example.com",
  "applicant_phone": "+1-555-0199",
  "responses": {
    "field_id_1": "response value",
    "field_id_2": ["option1", "option2"]
  }
}
3. The keys of "responses" object must be the exact field IDs from the input.
4. For select/radio/checkbox/skills fields, the values must ONLY be chosen from the provided options or skill names. If the field is a checkbox or skills field, it should be an array of selected options.
5. Make the candidate name, email, and phone realistic.
6. Provide high-quality, professional, realistic, and job-position-relevant answers for text and textarea fields.
7. Return ONLY the raw JSON string without any markdown fences, formatting, or extra text. Start directly with "{" and end directly with "}".`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API request failed');
  }

  const resultData = await response.json();
  const text = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No content returned from Gemini');
  }

  // Parse JSON
  let cleanedText = text.trim();
  // Strip markdown blocks if Gemini ignored the instruction
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanedText);
  if (!parsed.applicant_name || !parsed.applicant_email || !parsed.responses) {
    throw new Error('Incomplete JSON structure generated');
  }

  return {
    applicant_name: parsed.applicant_name,
    applicant_email: parsed.applicant_email,
    applicant_phone: parsed.applicant_phone || null,
    responses: parsed.responses,
  };
}
