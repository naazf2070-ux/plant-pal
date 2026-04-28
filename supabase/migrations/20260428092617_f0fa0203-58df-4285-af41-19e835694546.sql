CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  garden_item_id UUID NOT NULL REFERENCES public.garden_items(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Time to water your plant 💧',
  message TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_user_due ON public.reminders(user_id, due_at);
CREATE INDEX idx_reminders_garden_item ON public.reminders(garden_item_id);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
ON public.reminders FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own reminders"
ON public.reminders FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert reminders"
ON public.reminders FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins can delete reminders"
ON public.reminders FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;