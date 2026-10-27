-- Public student, coach, and staff registrations receive inactive profiles.
-- The authenticated admin workflow remains responsible for creating admins.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_role_name text;
    profile_role_id uuid;
    profile_name text;
    profile_school_id text;
    profile_id uuid;
BEGIN
    profile_role_name := lower(COALESCE(
        NULLIF(btrim(NEW.raw_user_meta_data ->> 'role'), ''),
        'student'
    ));

    IF profile_role_name = 'admin' THEN
        RETURN NEW;
    END IF;

    IF profile_role_name NOT IN ('student', 'coach', 'staff') THEN
        RAISE EXCEPTION 'Public registration role is not allowed.';
    END IF;

    SELECT id INTO profile_role_id
    FROM public.roles
    WHERE name = profile_role_name;

    IF profile_role_id IS NULL THEN
        RAISE EXCEPTION 'Registration role is not configured.';
    END IF;

    profile_name := COALESCE(
        NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        split_part(NEW.email, '@', 1)
    );
    profile_school_id := upper(NULLIF(btrim(NEW.raw_user_meta_data ->> 'school_id'), ''));

    IF profile_role_name = 'student' AND (profile_school_id IS NULL OR profile_school_id !~ '^[0-9]{7,15}$') THEN
        RAISE EXCEPTION 'Student ID must contain 7 to 15 digits.';
    ELSIF profile_role_name IN ('coach', 'staff') AND (profile_school_id IS NULL OR profile_school_id !~ '^[A-Z0-9][A-Z0-9-]{2,14}$') THEN
        RAISE EXCEPTION 'Employee ID must contain 3 to 15 letters, numbers, or hyphens.';
    END IF;

    INSERT INTO public.users (
        user_auth_id, email, full_name, school_id, role_id, status
    )
    VALUES (
        NEW.id, NEW.email, profile_name, profile_school_id, profile_role_id, 'inactive'
    )
    RETURNING id INTO profile_id;

    IF profile_id IS NULL THEN
        RAISE EXCEPTION 'An application profile already exists for this email.';
    END IF;

    IF profile_role_name = 'student' THEN
        INSERT INTO public.athletes (
            user_id, student_number, department, year_level, emergency_contact
        )
        VALUES (
            profile_id, profile_school_id, 'Athletics Department', 1, 'None'
        );
    ELSIF profile_role_name = 'coach' THEN
        INSERT INTO public.coaches (
            user_id, employee_number, specialization, license_level
        )
        VALUES (
            profile_id, profile_school_id, 'Varsity Athletics', 'Pending Review'
        );

        INSERT INTO public.athletes (
            user_id, student_number, department, year_level, emergency_contact
        )
        VALUES (
            profile_id, profile_school_id, 'Athletics Coaching Staff', 1, 'None'
        );
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user_profile();