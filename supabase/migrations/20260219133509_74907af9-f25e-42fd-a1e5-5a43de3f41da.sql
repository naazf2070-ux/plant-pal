
-- Add new columns to plants table
ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS plant_type text,
  ADD COLUMN IF NOT EXISTS soil_type text;

-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload plant images
CREATE POLICY "Admins can upload plant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plant-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete plant images
CREATE POLICY "Admins can delete plant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'plant-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow public read of plant images
CREATE POLICY "Plant images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-images');
