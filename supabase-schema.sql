-- Programlar tablosu
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seanslar tablosu
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_min INTEGER,
  notes TEXT DEFAULT '',
  recurrence_rule TEXT,
  recurrence_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_program_id ON sessions(program_id);

-- Drill şablonları (mikro parçalar)
CREATE TABLE IF NOT EXISTS section_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'genel',
  drills TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_templates_category ON section_templates(category);

-- ─── Auth / Kullanıcı Rolleri ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'assistant', 'guest')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin her şeyi görebilir
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Kullanıcı kendi profilini görebilir
CREATE POLICY "own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Session atamaları: bir session'ı kimler görebilir
CREATE TABLE IF NOT EXISTS session_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE session_assignments ENABLE ROW LEVEL SECURITY;

-- Admin tüm atamaları görebilir
CREATE POLICY "admin_all_assignments" ON session_assignments
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Kullanıcı kendi atamalarını görebilir
CREATE POLICY "own_assignments" ON session_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Session'lar için RLS: admin tümünü görür, assistant/guest sadece atanmış olduklarını
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_sessions" ON sessions
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "assigned_sessions" ON sessions
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM session_assignments WHERE session_id = sessions.id)
  );

-- Programlar için RLS: admin tümünü görür, assistant/guest hiçbirini görmez
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_programs" ON programs
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "assistant_own_programs" ON programs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'assistant')
    AND created_by = auth.uid()
  );

CREATE POLICY "guest_own_programs" ON programs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'guest')
    AND created_by = auth.uid()
  );

-- Section templates için RLS: admin tümünü görür
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_templates" ON section_templates
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "assistant_own_templates" ON section_templates
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'assistant')
    AND created_by = auth.uid()
  );

CREATE POLICY "guest_own_templates" ON section_templates
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'guest')
    AND created_by = auth.uid()
  );
