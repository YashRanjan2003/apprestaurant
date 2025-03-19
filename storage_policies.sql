-- Create policies for the menu-images bucket to allow all operations

-- INSERT policy (allows uploading files)
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'menu-images');

-- SELECT policy (allows viewing/downloading files)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- UPDATE policy (allows updating files)
CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'menu-images');

-- DELETE policy (allows deleting files)
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'menu-images'); 