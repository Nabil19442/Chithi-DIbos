-- =========================================================================
-- Chithi Dibosh (চিঠি দিবস) - Supabase Database Schema
-- Run this SQL in your Supabase Project: Dashboard > SQL Editor > New query
-- =========================================================================

-- 1. Create the letters table
CREATE TABLE IF NOT EXISTS public.letters (
    id TEXT PRIMARY KEY,
    subject TEXT,
    message TEXT NOT NULL,
    mood TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL
);

-- 2. Create indexes for high performance querying & filtering
CREATE INDEX IF NOT EXISTS idx_letters_created_at ON public.letters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_is_read ON public.letters (is_read);
CREATE INDEX IF NOT EXISTS idx_letters_mood ON public.letters (mood);

-- 3. Row Level Security (RLS) configuration
-- Enable RLS for data protection
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT new letters (Public letter submission)
CREATE POLICY "Allow public anonymous letter submission"
ON public.letters
FOR INSERT
WITH CHECK (true);

-- Allow service_role (Admin API backend) full access to read, update, delete
-- If you use SUPABASE_SERVICE_ROLE_KEY on Vercel backend, it automatically bypasses RLS.
-- If you use SUPABASE_ANON_KEY on Vercel backend, enable the following policy:
CREATE POLICY "Allow select for anon if needed"
ON public.letters
FOR SELECT
USING (true);

CREATE POLICY "Allow update for anon if needed"
ON public.letters
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete for anon if needed"
ON public.letters
FOR DELETE
USING (true);

-- Seed initial welcome letter
INSERT INTO public.letters (id, subject, message, mood, created_at, is_read)
VALUES (
    'chithi-welcome-01',
    'চিঠি দিবসের শুভেচ্ছা 💌',
    'চিঠি দিবসে আপনাকে জানাই অনেক অনেক শুভকামনা! এই ডিজিটাল চিঠি বক্সে আপনার প্রিয় মানুষের মনের কথাগুলো নীরবে জমা হবে।',
    '🤍 কৃতজ্ঞতা',
    NOW(),
    false
)
ON CONFLICT (id) DO NOTHING;
