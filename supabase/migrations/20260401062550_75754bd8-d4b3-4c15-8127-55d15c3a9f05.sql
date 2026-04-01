
-- Watering logs
CREATE TABLE public.watering_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garden_item_id UUID NOT NULL REFERENCES public.garden_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  watered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.watering_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own watering logs" ON public.watering_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own watering logs" ON public.watering_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own watering logs" ON public.watering_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Growth logs
CREATE TABLE public.growth_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garden_item_id UUID NOT NULL REFERENCES public.garden_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  height_cm NUMERIC,
  leaf_count INTEGER,
  health TEXT CHECK (health IN ('thriving', 'healthy', 'okay', 'struggling')),
  notes TEXT
);

ALTER TABLE public.growth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own growth logs" ON public.growth_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own growth logs" ON public.growth_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own growth logs" ON public.growth_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
