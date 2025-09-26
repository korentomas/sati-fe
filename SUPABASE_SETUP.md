# Supabase Setup Instructions

## The Issue
The current Supabase API key is invalid (returning 401 Unauthorized). You need to either:
1. Get the correct keys from your existing Supabase project
2. Create a new Supabase project

## Option 1: Get Correct Keys from Existing Project

1. Go to https://supabase.com/dashboard
2. Select your project (oywbpwlhruupdzbvwwjr)
3. Go to Settings → API
4. Copy the following:
   - **Project URL**: Should be `https://oywbpwlhruupdzbvwwjr.supabase.co`
   - **anon public key**: This is what we need to fix
   - **service_role key**: Optional, for server-side operations

## Option 2: Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Project name: `sati-fe`
   - Database Password: Save this securely!
   - Region: Choose closest to you
4. Wait for project to be created
5. Go to Settings → API and copy:
   - Project URL
   - anon public key

## Update Environment Variables

Once you have the correct keys, update `.env.local`:

```env
# Replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-correct-anon-key

# Optional: Database URLs (if you need direct DB access)
DATABASE_URL=your-database-url
DIRECT_URL=your-direct-url
```

## Setup Authentication in Supabase

1. Go to Authentication → Providers
2. Enable Email provider (should be enabled by default)
3. Configure:
   - Enable email confirmations: OFF (for development)
   - Minimum password length: 6

## Create Tables (if new project)

If you created a new project, run this SQL in the SQL Editor:

```sql
-- Users profile table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Test the Setup

After updating `.env.local`:

1. Restart the development server (Ctrl+C and `npm run dev`)
2. Go to http://localhost:3000/register
3. Try creating a new account
4. Check Supabase Dashboard → Authentication → Users to see if user was created

## Troubleshooting

- **Invalid API key error**: The anon key is incorrect or has been regenerated
- **CORS errors**: Check that your project URL is correct
- **Connection refused**: Ensure the Supabase project is active (not paused)