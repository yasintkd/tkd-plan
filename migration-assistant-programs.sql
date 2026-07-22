-- programs tablosuna created_by ekle
ALTER TABLE programs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE programs ALTER COLUMN updated_at SET DEFAULT now();
UPDATE programs SET updated_at = now() WHERE updated_at IS NULL;

-- section_templates tablosuna created_by ekle
ALTER TABLE section_templates ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE section_templates ALTER COLUMN updated_at SET DEFAULT now();
UPDATE section_templates SET updated_at = now() WHERE updated_at IS NULL;

-- programs RLS
DROP POLICY IF EXISTS no_programs_for_non_admin ON programs;
DROP POLICY IF EXISTS admin_all_programs ON programs;

CREATE POLICY "admin_all_programs" ON programs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "assistant_own_programs" ON programs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'assistant')
    AND created_by = auth.uid()
  );

-- section_templates RLS
DROP POLICY IF EXISTS no_templates_for_non_admin ON section_templates;
DROP POLICY IF EXISTS admin_all_templates ON section_templates;

CREATE POLICY "admin_all_templates" ON section_templates
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "assistant_own_templates" ON section_templates
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'assistant')
    AND created_by = auth.uid()
  );