insert into public.education_fund_stats(region, total_raised, children_enrolled)
values ('global', 0, 0)
on conflict (region) do nothing;

insert into public.task_types(name, description, icon)
values
  ('image_labeling', 'Image Labeling', '🖼️'),
  ('audio_transcription', 'Audio Transcription', '🎵'),
  ('ai_evaluation', 'AI Evaluation', '🤖'),
  ('Data Entry', 'Simple data entry tasks', '📝'),
  ('Content Moderation', 'Review and moderate content', '🛡️')
on conflict (name) do nothing;

insert into public.users (id, privy_did, last_login_at)
values (
  '5f3d8321-e60e-4391-a94a-ca26f05b3029',
  'did:privy:cmksv1i0d009jlb0cqo7f2w6k',
  now()
)
on conflict (privy_did)
do update set last_login_at = excluded.last_login_at;
