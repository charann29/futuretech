-- FutureTech Supabase Database Setup
-- Run this in your Supabase SQL Editor to create all necessary tables

-- 1. LEADS TABLE - Store all user leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    source TEXT, -- 'landing_page', 'fsat_test', 'ai_resume'
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update their own lead data
CREATE POLICY "Users can view own lead" ON public.leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead" ON public.leads
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. TEST RESULTS TABLE - Store FSAT test submissions
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    student_name TEXT,
    student_phone TEXT,
    score NUMERIC,
    max_score NUMERIC,
    percentage NUMERIC,
    scholarship_percentage NUMERIC,
    scholarship_amount NUMERIC,
    final_fee NUMERIC,
    answers JSONB,
    evaluation JSONB,
    metadata JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for test_results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own test results
CREATE POLICY "Users can view own test results" ON public.test_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" ON public.test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. RESUMES TABLE - Store AI-generated resumes
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    education TEXT,
    skills TEXT,
    experience TEXT,
    resume_html TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own resumes
CREATE POLICY "Users can view own resumes" ON public.resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON public.resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- Grant necessary permissions
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.test_results TO authenticated;
GRANT ALL ON public.resumes TO authenticated;
