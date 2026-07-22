-- ÖNCE: mevcut tüm policy'leri temizle
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_all_assignments" ON session_assignments;
DROP POLICY IF EXISTS "own_assignments" ON session_assignments;
DROP POLICY IF EXISTS "admin_all_sessions" ON sessions;
DROP POLICY IF EXISTS "assigned_sessions" ON sessions;
DROP POLICY IF EXISTS "admin_all_programs" ON programs;
DROP POLICY IF EXISTS "assistant_own_programs" ON programs;
DROP POLICY IF EXISTS "guest_own_programs" ON programs;
DROP POLICY IF EXISTS "admin_all_templates" ON section_templates;
DROP POLICY IF EXISTS "assistant_own_templates" ON section_templates;
DROP POLICY IF EXISTS "guest_own_templates" ON section_templates;

-- RLS'yi tekrar enable et (zaten aktifse sorun olmaz)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER fonksiyon: RLS'yi by-pass ederek rol sorgula
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
END;
$$;

-- ARTIK: yeni policy'ler (subquery yok, has_role() kullan)
-- profiles
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- session_assignments
CREATE POLICY "admin_all_assignments" ON session_assignments
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "own_assignments" ON session_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- sessions
CREATE POLICY "admin_all_sessions" ON sessions
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "assigned_sessions" ON sessions
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM session_assignments WHERE session_id = sessions.id)
  );

-- programs
CREATE POLICY "admin_all_programs" ON programs
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "assistant_own_programs" ON programs
  FOR ALL USING (
    public.has_role('assistant') AND created_by = auth.uid()
  );

CREATE POLICY "guest_own_programs" ON programs
  FOR ALL USING (
    public.has_role('guest') AND created_by = auth.uid()
  );

-- section_templates
CREATE POLICY "admin_all_templates" ON section_templates
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "assistant_own_templates" ON section_templates
  FOR ALL USING (
    public.has_role('assistant') AND created_by = auth.uid()
  );

CREATE POLICY "guest_own_templates" ON section_templates
  FOR ALL USING (
    public.has_role('guest') AND created_by = auth.uid()
  );