-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/delete their own avatars
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Avatar update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Avatar delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow public read for avatars
CREATE POLICY "Avatar public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
