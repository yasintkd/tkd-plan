-- Seni admin yap (profiles tablosu boşsa bile)
INSERT INTO profiles (id, email, display_name, role, status)
SELECT id, email, 'Yasin', 'admin', 'approved'
FROM auth.users
WHERE email = 'yasinceken@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'approved', display_name = 'Yasin';