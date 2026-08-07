/*
# Create contact-references storage bucket

1. Storage
- Create a public bucket named `contact-references` for storing
  reference images uploaded by contact form submitters.
2. Security
- The bucket is public so that submitted reference images can be
  viewed via their public URL (needed for the contact form flow).
- No RLS policies needed on storage objects for a public bucket,
  but we add an INSERT policy so anon users can upload.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-references', 'contact-references', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (anon + authenticated) to upload to the bucket
DROP POLICY IF EXISTS "anon_upload_contact_references" ON storage.objects;
CREATE POLICY "anon_upload_contact_references"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'contact-references');

-- Allow anyone to read (public bucket, but explicit policy for safety)
DROP POLICY IF EXISTS "anon_read_contact_references" ON storage.objects;
CREATE POLICY "anon_read_contact_references"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'contact-references');
