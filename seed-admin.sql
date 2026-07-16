-- İlk kullanıcıyı admin yap
-- Supabase SQL Editor'da çalıştır (1 kere)
UPDATE profiles
SET role = 'admin', status = 'approved'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);