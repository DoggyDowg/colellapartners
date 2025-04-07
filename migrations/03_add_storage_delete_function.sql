-- Add a function to delete objects from storage buckets
-- This will be callable from the client via RPC
CREATE OR REPLACE FUNCTION delete_storage_object(bucket_name TEXT, object_path TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _object_id UUID;
BEGIN
  -- Find the object ID from the storage.objects table
  SELECT id INTO _object_id
  FROM storage.objects
  WHERE bucket_id = bucket_name AND name = object_path;
  
  -- If object is found, delete it
  IF _object_id IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE id = _object_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant permissions to use the function via RPC
GRANT EXECUTE ON FUNCTION delete_storage_object TO authenticated;
GRANT EXECUTE ON FUNCTION delete_storage_object TO anon; 