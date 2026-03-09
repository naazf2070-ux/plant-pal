
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'feedback' CHECK (type IN ('feedback', 'issue', 'suggestion')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users view own feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users insert own feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins view all feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback (reply)
CREATE POLICY "Admins update feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for feedback
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
