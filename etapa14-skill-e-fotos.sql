-- ============================================================
-- ETAPA 14 — Skill da IA editável + armazenamento das fotos/logos
-- Não apaga nada. Pode rodar mais de uma vez.
-- ============================================================

BEGIN;

-- Skill da IA (em branco = usa a skill padrão do sistema)
ALTER TABLE public.configuracoes ADD COLUMN IF NOT EXISTS ia_skill text;

-- Pasta pública "logos" para fotos de clientes (já comprimidas no navegador, ~50 KB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Quem pode enviar/trocar/apagar: admin e equipe
DROP POLICY IF EXISTS "logos_equipe_envia" ON storage.objects;
CREATE POLICY "logos_equipe_envia" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "logos_equipe_altera" ON storage.objects;
CREATE POLICY "logos_equipe_altera" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "logos_equipe_apaga" ON storage.objects;
CREATE POLICY "logos_equipe_apaga" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND mf_papel() IN ('admin', 'equipe'));

-- Qualquer pessoa pode ver (as logos aparecem no portal e na agenda)
DROP POLICY IF EXISTS "logos_publico_ve" ON storage.objects;
CREATE POLICY "logos_publico_ve" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'ok — skill e fotos configuradas' AS resultado;
