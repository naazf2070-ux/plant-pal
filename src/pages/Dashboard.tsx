import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  Leaf,
  Droplets,
  Flame,
  Heart,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Award,
  Sprout,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GardenItem {
  id: string;
  added_at: string;
  plants: { name: string; image_url: string | null } | null;
}
interface WateringLog {
  id: string;
  watered_at: string;
  garden_item_id: string;
}
interface GrowthLog {
  id: string;
  logged_at: string;
  garden_item_id: string;
  health: string | null;
}
interface Reminder {
  id: string;
  title: string;
  message: string | null;
  due_at: string;
  completed_at: string | null;
  garden_item_id: string;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const calcStreak = (logs: WateringLog[]): number => {
  if (!logs.length) return 0;
  const days = new Set(
    logs.map((l) => startOfDay(new Date(l.watered_at)).getTime())
  );
  let streak = 0;
  const cursor = startOfDay(new Date());
  // allow today OR yesterday as start
  if (!days.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.getTime())) return 0;
  }
  while (days.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3 }}
    className="rounded-2xl bg-card border border-border/40 p-5 backdrop-blur-md relative overflow-hidden group"
    style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}
  >
    <div
      className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-15 blur-2xl group-hover:opacity-30 transition-opacity"
      style={{ background: color }}
    />
    <div className="flex items-center gap-2 mb-3 relative">
      <Icon className="w-4 h-4" style={{ color }} />
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body">
        {label}
      </p>
    </div>
    <p className="font-display text-3xl font-semibold text-foreground relative">
      {value}
    </p>
    {hint && (
      <p className="text-[11px] text-muted-foreground/70 font-body mt-1 relative">
        {hint}
      </p>
    )}
  </motion.div>
);

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  earned: boolean;
  color: string;
}

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GardenItem[]>([]);
  const [waterings, setWaterings] = useState<WateringLog[]>([]);
  const [growths, setGrowths] = useState<GrowthLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const filteredReminders = useMemo(
    () =>
      selectedPlant === "all"
        ? reminders
        : reminders.filter((r) => r.garden_item_id === selectedPlant),
    [reminders, selectedPlant]
  );

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [g, w, gr, r] = await Promise.all([
        supabase
          .from("garden_items")
          .select("id, added_at, plants(name, image_url)"),
        supabase.from("watering_logs").select("id, watered_at, garden_item_id"),
        supabase
          .from("growth_logs")
          .select("id, logged_at, garden_item_id, health"),
        supabase
          .from("reminders")
          .select("id, title, message, due_at, completed_at, garden_item_id"),
      ]);
      setItems((g.data as GardenItem[]) || []);
      setWaterings((w.data as WateringLog[]) || []);
      setGrowths((gr.data as GrowthLog[]) || []);
      setReminders((r.data as Reminder[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const streak = useMemo(() => calcStreak(waterings), [waterings]);

  const healthScore = useMemo(() => {
    if (!items.length) return 0;
    let score = 60;
    // Active care boost: any plant watered in last 7 days
    const weekAgo = Date.now() - 7 * 86400000;
    const recentWaters = waterings.filter(
      (w) => new Date(w.watered_at).getTime() > weekAgo
    ).length;
    score += Math.min(20, recentWaters * 3);
    // Streak boost
    score += Math.min(15, streak * 2);
    // Growth log boost
    if (growths.length) score += Math.min(10, growths.length * 2);
    // Overdue penalty
    const overdue = reminders.filter(
      (r) => !r.completed_at && new Date(r.due_at).getTime() < Date.now()
    ).length;
    score -= Math.min(30, overdue * 5);
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [items, waterings, streak, growths, reminders]);

  const upcomingReminders = useMemo(() => {
    const now = Date.now();
    return filteredReminders
      .filter((r) => !r.completed_at && new Date(r.due_at).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      )
      .slice(0, 5);
  }, [filteredReminders]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++)
      cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const remindersByDay = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    filteredReminders.forEach((r) => {
      const key = startOfDay(new Date(r.due_at)).toISOString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [filteredReminders]);

  const badges: Badge[] = useMemo(() => {
    const firstHealthy = growths.some(
      (g) => g.health && /good|great|healthy|excellent/i.test(g.health)
    );
    const totalWaters = waterings.length;
    const completedReminders = reminders.filter((r) => r.completed_at).length;
    return [
      {
        id: "sprout",
        name: "First Sprout",
        description: "Add your first plant to the garden",
        icon: Sprout,
        earned: items.length >= 1,
        color: "hsl(145 50% 55%)",
      },
      {
        id: "drop",
        name: "First Drop",
        description: "Log your first watering",
        icon: Droplets,
        earned: totalWaters >= 1,
        color: "hsl(200 70% 60%)",
      },
      {
        id: "streak3",
        name: "Consistent Carer",
        description: "Water 3 days in a row",
        icon: Flame,
        earned: streak >= 3,
        color: "hsl(25 90% 60%)",
      },
      {
        id: "streak7",
        name: "7-Day Streak",
        description: "Water 7 days in a row",
        icon: Flame,
        earned: streak >= 7,
        color: "hsl(0 80% 60%)",
      },
      {
        id: "bloom",
        name: "First Bloom",
        description: "Log a plant in healthy condition",
        icon: Sparkles,
        earned: firstHealthy,
        color: "hsl(320 70% 65%)",
      },
      {
        id: "collector",
        name: "Collector",
        description: "Grow 5 plants in your garden",
        icon: Leaf,
        earned: items.length >= 5,
        color: "hsl(145 60% 50%)",
      },
      {
        id: "greenthumb",
        name: "Green Thumb",
        description: "Log 20 waterings total",
        icon: Trophy,
        earned: totalWaters >= 20,
        color: "hsl(45 90% 55%)",
      },
      {
        id: "reliable",
        name: "Reliable",
        description: "Complete 10 reminders",
        icon: Award,
        earned: completedReminders >= 10,
        color: "hsl(260 70% 65%)",
      },
    ];
  }, [items, waterings, growths, reminders, streak]);

  const earnedCount = badges.filter((b) => b.earned).length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Leaf className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const monthName = month.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-20 pt-28 pb-20 space-y-10">
        {/* Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">
            Overview
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold">
            Garden Dashboard
          </h1>
          <p className="text-muted-foreground font-body">
            Your green journey at a glance.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Leaf}
            label="Total Plants"
            value={items.length}
            hint={
              items.length
                ? `${items.length === 1 ? "plant" : "plants"} growing`
                : "Add your first plant"
            }
            color="hsl(145 50% 55%)"
          />
          <StatCard
            icon={Flame}
            label="Watering Streak"
            value={`${streak}d`}
            hint={streak ? "Keep it going!" : "Water today to start"}
            color="hsl(25 90% 60%)"
          />
          <StatCard
            icon={Heart}
            label="Health Score"
            value={`${healthScore}%`}
            hint={
              healthScore >= 80
                ? "Thriving"
                : healthScore >= 50
                ? "Steady"
                : "Needs attention"
            }
            color="hsl(0 70% 60%)"
          />
          <StatCard
            icon={Trophy}
            label="Badges Earned"
            value={`${earnedCount}/${badges.length}`}
            hint="See achievements below"
            color="hsl(45 90% 55%)"
          />
        </div>

        {/* Calendar + Upcoming */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-2xl bg-card border border-border/40 p-6"
            style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">
                  {monthName}
                </h2>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setMonth(
                      new Date(today.getFullYear(), today.getMonth(), 1)
                    )
                  }
                  className="px-3 text-[10px] tracking-widest uppercase font-body rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] tracking-widest uppercase text-muted-foreground/60 font-body py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                if (!d)
                  return <div key={i} className="aspect-square rounded-lg" />;
                const key = startOfDay(d).toISOString();
                const dayReminders = remindersByDay.get(key) || [];
                const isToday = sameDay(d, today);
                const isPast = startOfDay(d) < startOfDay(today);
                const hasOverdue = dayReminders.some(
                  (r) => !r.completed_at && isPast && !isToday
                );
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.04 }}
                    className={cn(
                      "aspect-square rounded-lg p-1.5 flex flex-col text-[11px] font-body border transition-all",
                      isToday
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : dayReminders.length
                        ? hasOverdue
                          ? "border-destructive/40 bg-destructive/5 text-foreground"
                          : "border-primary/30 bg-primary/5 text-foreground"
                        : "border-border/20 text-muted-foreground/70"
                    )}
                    title={dayReminders.map((r) => r.title).join("\n")}
                  >
                    <span className="font-medium">{d.getDate()}</span>
                    {dayReminders.length > 0 && (
                      <div className="mt-auto flex gap-0.5 flex-wrap">
                        {dayReminders.slice(0, 3).map((r, j) => (
                          <span
                            key={j}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              r.completed_at
                                ? "bg-muted-foreground/40"
                                : hasOverdue
                                ? "bg-destructive"
                                : "bg-primary"
                            )}
                          />
                        ))}
                        {dayReminders.length > 3 && (
                          <span className="text-[8px] text-muted-foreground">
                            +{dayReminders.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 text-[10px] tracking-wider uppercase text-muted-foreground/70 font-body">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Overdue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> Done
              </span>
            </div>
          </motion.div>

          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border/40 p-6"
            style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-gold" />
              <h2 className="font-display text-lg font-semibold">Upcoming Tasks</h2>
            </div>
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Leaf className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground font-body">
                  No upcoming tasks.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingReminders.map((r) => {
                  const due = new Date(r.due_at);
                  const days = Math.ceil(
                    (due.getTime() - Date.now()) / 86400000
                  );
                  return (
                    <li
                      key={r.id}
                      className="flex items-start gap-3 pb-3 border-b border-border/20 last:border-0 last:pb-0"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-body font-medium text-foreground line-clamp-1">
                          {r.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-body">
                          {days === 0
                            ? "Today"
                            : days === 1
                            ? "Tomorrow"
                            : `In ${days} days`}{" "}
                          ·{" "}
                          {due.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card border border-border/40 p-6"
          style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              <h2 className="font-display text-lg font-semibold">Achievements</h2>
            </div>
            <p className="text-[11px] tracking-widest uppercase text-muted-foreground font-body">
              {earnedCount} / {badges.length} unlocked
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -3 }}
                  className={cn(
                    "rounded-xl p-4 border text-center relative overflow-hidden transition-all",
                    b.earned
                      ? "bg-card border-border/40"
                      : "bg-muted/20 border-border/20 opacity-50 grayscale"
                  )}
                  title={b.description}
                >
                  {b.earned && (
                    <div
                      className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl"
                      style={{ background: b.color }}
                    />
                  )}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 relative"
                    style={{
                      background: b.earned
                        ? `${b.color}33`
                        : "hsl(var(--muted))",
                    }}
                  >
                    {b.earned ? (
                      <Icon className="w-5 h-5" style={{ color: b.color }} />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-display text-sm font-semibold text-foreground relative">
                    {b.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-body mt-1 relative line-clamp-2">
                    {b.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
