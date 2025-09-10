# MindFlow Dashboard - Auth-Profile Sync Configuration Guide

## Overview
This guide outlines the steps to properly configure the authentication to profile synchronization in Supabase for the MindFlow Dashboard.

## Current Issues Identified

### 1. Inconsistent Trigger Implementation
- Two different trigger migrations exist with conflicting logic
- Basic trigger lacks safety checks and error handling
- Missing comprehensive profile fields

### 2. Missing Profile Fields
The current triggers only handle basic fields, but the application expects:
- `streak`, `xp`, `last_activity`, `last_opened`
- `daily_xp_goal`, `daily_xp_streak`, `perfect_weeks`
- `weekend_streak`, `night_owl_sessions`, `early_bird_sessions`
- `speed_learner_count`, `consistent_days`

### 3. Authentication Hook Issue
- Using `supabase.auth.admin.signUp()` which is incorrect for client-side usage
- Should use `supabase.auth.signUp()` instead

## Solution Implementation

### Step 1: Apply the New Migration

1. **Navigate to Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/20250120000000_fix_auth_profile_sync.sql`
   - Paste and execute in the SQL Editor
   - This will:
     - Create/update the profiles table with all required fields
     - Create a robust trigger function with error handling
     - Set up proper RLS policies
     - Add necessary indexes for performance

### Step 2: Verify the Configuration

1. **Check the Trigger**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Verify Profile Table Structure**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   ORDER BY ordinal_position;
   ```

3. **Test the Trigger**
   ```sql
   -- Create a test user (this will trigger profile creation)
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     'test@example.com',
     crypt('password', gen_salt('bf')),
     now(),
     now(),
     now()
   );
   
   -- Check if profile was created
   SELECT * FROM profiles WHERE email = 'test@example.com';
   ```

### Step 3: Update Application Code

The authentication hook has been fixed to use the correct method:
- ✅ Changed from `supabase.auth.admin.signUp()` to `supabase.auth.signUp()`

### Step 4: Test the Complete Flow

1. **Sign Up Flow**
   - Create a new user account through the application
   - Verify that a profile is automatically created
   - Check that all profile fields are properly initialized

2. **Profile Data Access**
   - Verify that the `useProfile` hook can fetch profile data
   - Test profile updates and XP/streak calculations

3. **Error Handling**
   - Test edge cases like duplicate emails
   - Verify that auth failures don't break the application

## Key Features of the New Configuration

### 1. Robust Trigger Function
- **Safety Checks**: Only creates profile if it doesn't exist
- **Error Handling**: Logs errors but doesn't fail auth process
- **Flexible Name Extraction**: Uses metadata, email, or fallback
- **Complete Field Initialization**: Sets all required fields with defaults

### 2. Comprehensive Profile Schema
- All fields required by the application
- Proper data types and constraints
- Default values for new users
- Timestamps for tracking

### 3. Security & Performance
- Row Level Security (RLS) enabled
- Proper policies for authenticated users
- Indexes for better query performance
- Proper permissions granted

## Troubleshooting

### Common Issues

1. **Trigger Not Firing**
   - Check if the trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
   - Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

2. **Profile Not Created**
   - Check for errors in Supabase logs
   - Verify RLS policies are correct
   - Ensure user has proper permissions

3. **Missing Fields**
   - Run the migration again to add missing columns
   - Check if the profiles table has all required columns

### Debugging Commands

```sql
-- Check trigger status
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check function definition
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check table structure
\d profiles
```

## Next Steps

After implementing this configuration:

1. **Monitor Logs**: Watch for any errors in Supabase logs
2. **Test User Flows**: Verify sign-up, sign-in, and profile management
3. **Performance Check**: Monitor query performance with the new indexes
4. **Backup**: Consider backing up the current database state

## Files Modified

- ✅ `supabase/migrations/20250120000000_fix_auth_profile_sync.sql` - New comprehensive migration
- ✅ `src/hooks/useAuth.ts` - Fixed authentication method
- ✅ `docs/AUTH_PROFILE_SYNC_SETUP.md` - This guide

## Support

If you encounter any issues during implementation:
1. Check the Supabase logs for detailed error messages
2. Verify all SQL commands executed successfully
3. Test with a fresh user account to isolate issues
4. Review the troubleshooting section above 