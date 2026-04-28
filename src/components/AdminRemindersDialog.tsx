import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Bell, CalendarIcon, Droplets, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GardenItem {
  id: string;
  plant_id: string;
  plants: { name: string; image_url: string | null } | null;
}

interface Reminder {
  id: string;
  garden_item_id: string;
  title: string;
  message: string | null;
  due_at: string;
  read_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string | null;
  userName: string | null;
}

const DEFAULT_TITLE = "Time to water your plant 💧";
const TITLE_MAX = 100;
const MESSAGE_MAX = 500;
const ONE_DAY_MS = 86_400_000;

const tomorrow = () => new Date(Date.now() + ONE_DAY_MS);
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const AdminRemindersDialog = ({ open, onOpenChange, userId, userName }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<GardenItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  const [gardenItemId, setGardenItemId] = useState<string>("");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState<Date | undefined>(tomorrow);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setTitle(DEFAULT_TITLE);
    setMessage("");
    setDueAt(tomorrow());
    setGardenItemId("");
  }, []);

  // Reset form whenever the target user changes or the dialog closes.
  useEffect(() => {
    if (!open) resetForm();
  }, [open, userId, resetForm]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [itemsRes, remRes] = await Promise.all([
      supabase
        .from("garden_items")
        .select("id, plant_id, plants(name, image_url)")
        .eq("user_id", userId),
      supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("due_at", { ascending: true }),
    ]);
    const itemsData = (itemsRes.data ?? []) as unknown as GardenItem[];
    setItems(itemsData);
    setGardenItemId((current) =>
      current && itemsData.some((i) => i.id === current)
        ? current
        : itemsData[0]?.id ?? "",
    );
    if (remRes.data) setReminders(remRes.data as Reminder[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (open && userId) fetchData();
  }, [open, userId, fetchData]);

  const createReminder = async () => {
    if (!user || !userId || !gardenItemId || !dueAt) {
      toast({
        title: "Missing fields",
        description: "Pick a plant and a due date.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reminders").insert({
      user_id: userId,
      garden_item_id: gardenItemId,
      created_by: user.id,
      title: title.trim() || DEFAULT_TITLE,
      message: message.trim() || null,
      due_at: dueAt.toISOString(),
    });
    if (error) {
      toast({
        title: "Failed to create",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Reminder sent 🔔" });
      setMessage("");
      fetchData();
    }
    setSaving(false);
  };

  const deleteReminder = async (id: string) => {
    const previous = reminders;
    setReminders((p) => p.filter((r) => r.id !== id));
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) {
      setReminders(previous);
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const itemName = (id: string) =>
    items.find((i) => i.id === id)?.plants?.name ?? "Plant";

  const hasItems = items.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Reminders for{" "}
            {userName || "User"}
          </DialogTitle>
          <DialogDescription className="font-body text-xs">
            Schedule watering reminders for this user's garden plants.
          </DialogDescription>
        </DialogHeader>

        {/* New reminder form */}
        <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/40">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">
            New Reminder
          </p>

          {!hasItems ? (
            <p className="text-sm text-muted-foreground font-body py-2">
              This user hasn't added any plants to their garden yet.
            </p>
          ) : (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1 block">
                  Plant
                </label>
                <Select value={gardenItemId} onValueChange={setGardenItemId}>
                  <SelectTrigger className="font-body text-sm bg-card/60 border-border/60">
                    <SelectValue placeholder="Select a plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.plants?.name ?? "Plant"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1 block">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={TITLE_MAX}
                    className="font-body text-sm bg-card/60 border-border/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1 block">
                    Due date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-body text-sm bg-card/60 border-border/60",
                          !dueAt && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueAt ? format(dueAt, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueAt}
                        onSelect={setDueAt}
                        disabled={(d) => d < startOfToday()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1 block">
                  Message (optional)
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MESSAGE_MAX}
                  placeholder="e.g. Don't forget to mist the leaves too!"
                  className="font-body text-sm bg-card/60 border-border/60 min-h-[60px]"
                />
              </div>

              <Button
                onClick={createReminder}
                disabled={saving || !gardenItemId || !dueAt}
                className="w-full font-body text-xs tracking-wider uppercase"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Send Reminder
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Existing reminders */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">
            Active Reminders ({reminders.length})
          </p>
          {loading ? (
            <p className="text-center text-muted-foreground/50 text-sm font-body py-4">
              Loading…
            </p>
          ) : reminders.length === 0 ? (
            <p className="text-center text-muted-foreground/50 text-sm font-body py-4">
              No reminders yet.
            </p>
          ) : (
            reminders.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 group"
              >
                <Droplets className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-body text-foreground truncate">
                      {r.title}
                    </p>
                    <span className="text-[10px] font-body px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {itemName(r.garden_item_id)}
                    </span>
                    {r.read_at && (
                      <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                        Read
                      </span>
                    )}
                    {r.completed_at && (
                      <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                    Due {format(new Date(r.due_at), "PPP")}
                  </p>
                  {r.message && (
                    <p className="text-[11px] text-muted-foreground/80 font-body mt-1">
                      {r.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Delete reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRemindersDialog;
