import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, Bug, Lightbulb, MessageCircle } from "lucide-react";

type FeedbackType = "feedback" | "issue" | "suggestion";

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  subject: string;
  message: string;
  admin_reply: string | null;
  replied_at: string | null;
  status: string;
  created_at: string;
}

const typeConfig: Record<FeedbackType, { label: string; icon: typeof MessageCircle; color: string }> = {
  feedback: { label: "Feedback", icon: MessageCircle, color: "bg-primary/20 text-primary" },
  issue: { label: "Report Issue", icon: Bug, color: "bg-destructive/20 text-destructive" },
  suggestion: { label: "Suggestion", icon: Lightbulb, color: "bg-accent/20 text-accent" },
};

const statusBadge: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  replied: "bg-primary/20 text-primary",
  closed: "bg-secondary text-secondary-foreground",
};

const Feedback = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchFeedback();
  }, [user]);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setFeedbackList(data as FeedbackItem[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("feedback").insert({
      user_id: user!.id,
      type,
      subject: subject.trim(),
      message: message.trim(),
    });

    if (error) {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Feedback submitted! ✉️" });
      setSubject("");
      setMessage("");
      setType("feedback");
      fetchFeedback();
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-20 py-12 pt-28">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold mb-2 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Feedback Portal
            </h1>
            <p className="text-muted-foreground font-body">
              Share your thoughts, report issues, or suggest improvements.
            </p>
          </div>

          {/* Submit Form */}
          <Card className="border-primary/20 bg-background/60 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="font-display text-lg">Submit Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type selector */}
                <div className="space-y-2">
                  <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Type</Label>
                  <div className="flex gap-2">
                    {(Object.keys(typeConfig) as FeedbackType[]).map((t) => {
                      const cfg = typeConfig[t];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-body transition-all ${
                            type === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background hover:border-primary/30"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Subject *</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-xs tracking-widest uppercase text-muted-foreground">Message *</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe in detail..."
                    rows={4}
                    required
                    maxLength={2000}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting} className="font-body text-xs tracking-widest uppercase">
                    <Send className="w-3 h-3 mr-2" />
                    {submitting ? "Sending…" : "Submit"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Previous feedback */}
          <h2 className="font-display text-xl font-semibold mb-4">Your Submissions</h2>
          {loading ? (
            <p className="text-muted-foreground font-body">Loading...</p>
          ) : feedbackList.length === 0 ? (
            <p className="text-muted-foreground font-body text-center py-8">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((fb) => {
                const cfg = typeConfig[fb.type as FeedbackType];
                return (
                  <Card key={fb.id} className="border-border/50 bg-card/80">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${cfg.color} text-xs font-body`}>{cfg.label}</Badge>
                          <Badge className={`${statusBadge[fb.status]} text-xs font-body`}>{fb.status}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-body">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold">{fb.subject}</h3>
                      <p className="font-body text-sm text-muted-foreground whitespace-pre-wrap">{fb.message}</p>

                      {fb.admin_reply && (
                        <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/20">
                          <p className="text-xs text-primary font-body font-medium mb-1">Admin Reply</p>
                          <p className="font-body text-sm whitespace-pre-wrap">{fb.admin_reply}</p>
                          {fb.replied_at && (
                            <p className="text-xs text-muted-foreground mt-2 font-body">
                              {new Date(fb.replied_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feedback;
