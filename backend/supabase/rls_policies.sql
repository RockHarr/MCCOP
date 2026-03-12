-- =====================================================
-- RLS POLICIES para MCCOP - Fase 1
-- Ejecutar este script en el SQL Editor de Supabase
-- DESPUÉS de haber corrido schema.sql
-- =====================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- 2. Oportunidades: cualquier usuario autenticado puede leerlas (son datos públicos de MP)
CREATE POLICY "Autenticados pueden leer oportunidades"
    ON public.opportunities FOR SELECT
    TO authenticated
    USING (true);

-- 3. Matches: cualquier autenticado puede ver los matches (V1 single-tenant)
CREATE POLICY "Autenticados pueden leer matches"
    ON public.opportunity_matches FOR SELECT
    TO authenticated
    USING (true);

-- 4. Decisiones: cada usuario solo ve y modifica sus propias decisiones
CREATE POLICY "Usuarios ven sus propias decisiones"
    ON public.user_decisions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus decisiones"
    ON public.user_decisions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus decisiones"
    ON public.user_decisions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. Perfiles de negocio: cada usuario ve y edita los suyos
CREATE POLICY "Usuarios ven sus perfiles"
    ON public.business_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus perfiles"
    ON public.business_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios editan sus perfiles"
    ON public.business_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Keywords: acceso a través del perfil del usuario
CREATE POLICY "Usuarios ven keywords de sus perfiles"
    ON public.keywords FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
        )
    );

-- 7. Notas: cada usuario ve las suyas
CREATE POLICY "Usuarios ven sus notas"
    ON public.notes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus notas"
    ON public.notes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 8. Ingestion runs: solo lectura para autenticados
CREATE POLICY "Autenticados pueden ver corridas de ingesta"
    ON public.ingestion_runs FOR SELECT
    TO authenticated
    USING (true);
