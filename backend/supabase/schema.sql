-- Schema original para base de datos de MCCOP

-- Profiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min_amount NUMERIC(15, 2) DEFAULT 0,
    max_amount NUMERIC(15, 2),
    regions TEXT[], -- array of region codes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Keywords
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('positive', 'negative')) NOT NULL, -- positive for matching, negative for excluding
    word TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Opportunities (Raw and Normalized from M.P.)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_code TEXT UNIQUE NOT NULL, -- codigo_externo
    title TEXT NOT NULL,
    description TEXT,
    raw_status TEXT,
    type TEXT,
    closed_at TIMESTAMP WITH TIME ZONE, -- fecha_cierre
    estimated_amount NUMERIC(15, 2),
    currency TEXT,
    org_name TEXT,
    buyer_unit TEXT,
    raw_json JSONB, -- JSON íntegro original
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Matches
CREATE TABLE IF NOT EXISTS public.opportunity_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    matched_keywords JSONB, -- JSON Array of matched words
    is_dismissed_by_engine BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(opportunity_id, profile_id)
);

-- User Decisions
CREATE TABLE IF NOT EXISTS public.user_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_match_id UUID NOT NULL REFERENCES public.opportunity_matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('postular', 'mirar', 'descartar', 'archivada')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(opportunity_match_id, user_id)
);

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ingestion Runs
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    new_records_count INTEGER DEFAULT 0,
    updated_records_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('running', 'success', 'error')) NOT NULL,
    error_log TEXT
);

-- Omitiendo RLS por ahora (simplicidad de testing local y prototipado rápido), 
-- salvo que se vaya a desplegar a múltiples empresas inmediatamente.
