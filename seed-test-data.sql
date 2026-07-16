-- TEST VERİSİ: Bu SQL'i Supabase SQL Editor'da çalıştır.
-- ÖNCE kendi user ID'ni bul ve aşağıdaki INSERT'lerde kullan.
-- User ID'ni Supabase Studio > Authentication > Users tablosundan bulabilirsin.
-- Veya şu sorguyla: SELECT id, email FROM auth.users;

-- === 1. Profilini güncelle (zaten admin yaptıysan atla) ===
-- UPDATE profiles SET role = 'admin', status = 'approved'
-- WHERE id = 'KENDI_USER_ID_NI_YAZ';

-- === 2. Örnek Program ===
INSERT INTO programs (id, name, sections)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Temel Teknik - Beyaz Kuşak',
  '[
    {"title": "Isınma", "duration": 10, "description": "Koşu, esneme"},
    {"title": "Temel Duruşlar", "duration": 15, "description": "Ap seogi, joonbi seogi"},
    {"title": "Temel Tekme", "duration": 20, "description": "Ap chagi, dollyo chagi"},
    {"title": "Soğuma", "duration": 5, "description": "Esneme"}
  ]'::jsonb
);

-- === 3. Örnek Seans (bugün) ===
INSERT INTO sessions (id, program_id, date, start_time, duration_min, notes)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE,
  '18:00',
  60,
  'Salon 1 - Antrenman için hazırlıklı gelin'
);

-- === 4. Örnek Şablon ===
INSERT INTO section_templates (id, title, category, drills)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  'Temel Ap Chagi Drill',
  'tekme',
  '1. Ap chagi havada 10x sağ\n2. Ap chagi havada 10x sol\n3. Ap chagi hedefe 10x sağ\n4. Ap chagi hedefe 10x sol\n5. Kombine 10x'
);