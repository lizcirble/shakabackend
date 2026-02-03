-- Sample task types
INSERT INTO task_types (id, name, description, icon) VALUES
('tt1', 'image_labeling', 'Label and categorize images', 'image'),
('tt2', 'audio_transcription', 'Transcribe audio to text', 'audio'),
('tt3', 'ai_evaluation', 'Evaluate AI model outputs', 'ai')
ON CONFLICT (id) DO NOTHING;

-- Sample tasks (you'll need to replace client_id with actual profile IDs)
INSERT INTO tasks (
  id, client_id, task_type_id, title, description, instructions, 
  payout_amount, estimated_time_minutes, status, priority, 
  worker_count, target_countries, created_at, expires_at
) VALUES
(
  'task1',
  'temp-id-user1', -- Replace with actual client profile ID
  'tt1',
  'Label African Wildlife Images',
  'Help improve AI recognition of African wildlife by labeling images of animals in their natural habitat.',
  'Look at each image and select the correct animal from the dropdown menu. Focus on identifying lions, elephants, giraffes, and zebras.',
  2.50,
  5,
  'available',
  1,
  10,
  ARRAY['KE', 'TZ', 'ZA', 'BW'],
  NOW(),
  NOW() + INTERVAL '7 days'
),
(
  'task2',
  'temp-id-user1',
  'tt2', 
  'Transcribe Swahili Audio Clips',
  'Transcribe short audio clips in Swahili to help train speech recognition models.',
  'Listen to the audio clip and type exactly what you hear. Pay attention to proper spelling and punctuation.',
  3.00,
  8,
  'available',
  2,
  5,
  ARRAY['KE', 'TZ', 'UG'],
  NOW(),
  NOW() + INTERVAL '5 days'
),
(
  'task3',
  'temp-id-user1',
  'tt3',
  'Evaluate AI Translations',
  'Review AI-generated translations from English to local African languages.',
  'Rate the quality of translations on accuracy, fluency, and cultural appropriateness. Provide brief feedback.',
  4.00,
  10,
  'available',
  1,
  8,
  ARRAY['NG', 'GH', 'KE', 'ZA'],
  NOW(),
  NOW() + INTERVAL '10 days'
),
(
  'task4',
  'temp-id-user1',
  'tt1',
  'Categorize Market Scene Photos',
  'Help AI understand African market environments by categorizing photos of local markets.',
  'Tag photos with relevant categories: fruits, vegetables, textiles, electronics, etc.',
  1.75,
  3,
  'available',
  3,
  15,
  ARRAY['NG', 'KE', 'GH', 'SN'],
  NOW(),
  NOW() + INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;
