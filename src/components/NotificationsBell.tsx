import { useEffect, useState } from "react";
import { Bell, Droplets, Check, X } from "lucide-react";
import { format, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  due_at: string;
  read_at: string | null;
  completed_at: string | null;
  garden_item_id: string;
}

const NotificationsBell = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);

  const fetchReminders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reminders")
      .select("id, title, message, due_at, read_at, completed_at, garden_item_id")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .order("due_at", { ascending: true });
    if (data) setReminders(data as Reminder[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchReminders();
    const channel = supabase
      .channel(`reminders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminders", filter: `user_id=eq.${user.id}` },
        () => fetchReminders()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Mark all as read when opened
  useEffect(() => {
    if (!open || !user) return;
    const unread = reminders.filter((r) => !r.read_at).map((r) => r.id);
    if (unread.length === 0) return;
    supabase
      .from("reminders")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread)
      .then(() => fetchReminders());
  }, [open]);

  const markDone = async (id: string) => {
    await supabase.from("reminders").update({ completed_at: new Date().toISOString() }).eq("id", id);
    setReminders((p) => p.filter((r) => r.id !== id));
  };

  const dismiss = async (id: string) => {
    await supabase.from("reminders").update({ completed_at: new Date().toISOString() }).eq("id", id);
    setReminders((p) => p.filter((r) => r.id !== id));
  };

  if (!user) return null;

  const unreadCount = reminders.filter((r) => !r.read_at).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative text-muted-foreground hover:text-foreground"
          title="Reminders"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-body">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-background border-border">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="font-display text-sm font-semibold flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-primary" /> Reminders
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {reminders.length === 0 ? (
            <p className="text-center text-muted-foreground/60 text-xs font-body py-8 px-4">
              No reminders. You're all caught up! 🌿
            </p>
          ) : (
            <AnimatePresence>
              {reminders.map((r) => {
                const overdue = isPast(new Date(r.due_at));
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className={cn(
                      "px-4 py-3 border-b border-border/30 group hover:bg-muted/30 transition-colors",
                      !r.read_at && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Droplets className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", overdue ? "text-destructive" : "text-primary")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-body text-foreground">{r.title}</p>
                        <p className={cn("text-[10px] font-body mt-0.5", overdue ? "text-destructive" : "text-muted-foreground")}>
                          {overdue ? "Overdue · " : "Due "}{format(new Date(r.due_at), "PP")}
                        </p>
                        {r.message && (
                          <p className="text-[11px] text-muted-foreground/80 font-body mt-1">{r.message}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => markDone(r.id)}
                            className="text-[10px] font-body uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Done
                          </button>
                          <button
                            onClick={() => dismiss(r.id)}
                            className="text-[10px] font-body uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
