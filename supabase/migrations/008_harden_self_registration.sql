-- Create only pending student profiles for new Auth users. Existing profiles
-- are never auto-linked; an administrator must link invited accounts.
DROP POLICY IF EXISTS "users: allow user self-registration" ON users;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    student_role_id uuid;
    profile_name text;
    profile_school_id text;
BEGIN
    SELECT id INTO student_role_id
    FROM public.roles
    WHERE name = 'student';

    IF student_role_id IS NULL THEN
        RAISE EXCEPTION 'Student role is not configured.';
    END IF;

    profile_name := COALESCE(
        NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        split_part(NEW.email, '@', 1)
    );
    profile_school_id := NULLIF(NEW.raw_user_meta_data ->> 'school_id', '');
    IF profile_school_id IS NOT NULL AND profile_school_id !~ '^[0-9]{7,15}$' THEN
        profile_school_id := NULL;
    END IF;

    INSERT INTO public.users (
        user_auth_id, email, full_name, school_id, role_id, status
    )
    VALUES (
        NEW.id, NEW.email, profile_name, profile_school_id, student_role_id, 'inactive'
    )
    ON CONFLICT (email) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user_profile();
