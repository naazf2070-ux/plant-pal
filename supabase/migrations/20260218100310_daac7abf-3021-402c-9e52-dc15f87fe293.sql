
-- Create plants table (admin managed)
CREATE TABLE public.plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latin text,
  description text,
  care_instructions text,
  light_requirements text,
  watering_frequency text,
  image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can view plants
CREATE POLICY "Plants are publicly viewable"
  ON public.plants FOR SELECT
  USING (true);

-- Only admins can insert plants
CREATE POLICY "Admins can insert plants"
  ON public.plants FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update plants
CREATE POLICY "Admins can update plants"
  ON public.plants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete plants
CREATE POLICY "Admins can delete plants"
  ON public.plants FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user garden (saved plants per user)
CREATE TABLE public.garden_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plant_id uuid NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  notes text,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, plant_id)
);

ALTER TABLE public.garden_items ENABLE ROW LEVEL SECURITY;

-- Users can only view their own garden
CREATE POLICY "Users view own garden"
  ON public.garden_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their own garden
CREATE POLICY "Users insert own garden"
  ON public.garden_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own garden
CREATE POLICY "Users delete own garden"
  ON public.garden_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on plants
CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON public.plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
