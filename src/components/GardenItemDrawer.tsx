import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Droplets, TrendingUp, Leaf, Sun, Sprout, Plus, Trash2, Heart,
} from "lucide-react";

interface GardenItem {
  id: string;
  plant_id: string;
  added_at: string;
  plants: {
    id: string;
    name: string;
    latin: string | null;
    description: string | null;
    care_instructions: string | null;
    light_requirements: string | null;
    watering_frequency: string | null;
    image_url: string | null;
    category: string | null;
    plant_type: string | null;
    soil_type: string | null;
  };
}

interface WateringLog {
  id: string;
  watered_at: string;
  notes: string | null;
}

interface GrowthLog {
  id: string;
  logged_at: string;
  height_cm: number | null;
  leaf_count: number | null;
  health: string | null;
  notes: string | null;
}

interface Props {
  item: GardenItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HEALTH_OPTIONS = [
  { value: "thriving", label: "🌟 Thriving", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "healthy", label: "🌿 Healthy", color: "bg-primary/15 text-primary border-primary/30" },
  { value: "okay", label: "😐 Okay", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  { value: "struggling", label: "🥀 Struggling", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

const GardenItemDrawer = ({ item, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"water" | "growth">("water");
  const [wateringLogs, setWateringLogs] = useState<WateringLog[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Watering form
  const [waterNote, setWaterNote] = useState("");
  const [addingWater, setAddingWater] = useState(false);

  // Growth form
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [leafCount, setLeafCount] = useState("");
  const [health, setHealth] = useState("healthy");
  const [growthNote, setGrowthNote] = useState("");
  const [addingGrowth, setAddingGrowth] = useState(false);

  useEffect(() => {
    if (item && open) {
      fetchLogs();
    }
  }, [item, open]);

  const fetchLogs = async () => {
    if (!item) return;
    setLoading(true);
    const [waterRes, growthRes] = await Promise.all([
      supabase
        .from("watering_logs")
        .select("id, watered_at, notes")
        .eq("garden_item_id", item.id)
        .order("watered_at", { ascending: false })
        .limit(20),
      supabase
        .from("growth_logs")
        .select("id, logged_at, height_cm, leaf_count, health, notes")
        .eq("garden_item_id", item.id)
        .order("logged_at", { ascending: false })
        .limit(20),
    ]);
    if (waterRes.data) setWateringLogs(waterRes.data as WateringLog[]);
    if (growthRes.data) setGrowthLogs(growthRes.data as GrowthLog[]);
    setLoading(false);
  };

  const logWatering = async () => {
    if (!item || !user) return;
    setAddingWater(true);
    const { error } = await supabase.from("watering_logs").insert({
      garden_item_id: item.id,
      user_id: user.id,
      notes: waterNote || null,
    });
    if (error) {
      toast({ title: "Failed to log", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Watering logged 💧" });
      setWaterNote("");
      fetchLogs();
    }
    setAddingWater(false);
  };

  const logGrowth = async () => {
    if (!item || !user) return;
    setAddingGrowth(true);
    const { error } = await supabase.from("growth_logs").insert({
      garden_item_id: item.id,
      user_id: user.id,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      leaf_count: leafCount ? parseInt(leafCount) : null,
      health,
      notes: growthNote || null,
    });
    if (error) {
      toast({ title: "Failed to log", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Growth logged 📈" });
      setHeightCm("");
      setLeafCount("");
      setHealth("healthy");
      setGrowthNote("");
      setShowGrowthForm(false);
      fetchLogs();
    }
    setAddingGrowth(false);
  };

  const deleteWaterLog = async (id: string) => {
    await supabase.from("watering_logs").delete().eq("id", id);
    setWateringLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const deleteGrowthLog = async (id: string) => {
    await supabase.from("growth_logs").delete().eq("id", id);
    setGrowthLogs((prev) => prev.filter((l) => l.id !== id));
  };

  if (!item) return null;
  const plant = item.plants;

  const lastWatered = wateringLogs[0]
    ? new Date(wateringLogs[0].watered_at)
    : null;
  const daysSinceWater = lastWatered
    ? Math.floor((Date.now() - lastWatered.getTime()) / 86400000)
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh] bg-background border-border">
        <div className="overflow-y-auto px-6 pb-8">
          <DrawerHeader className="px-0 pt-4">
            <div className="flex items-center gap-3 mb-1">
              {plant.image_url && (
                <img src={plant.image_url} alt={plant.name} className="w-10 h-10 rounded-xl object-contain bg-muted p-1" />
              )}
              <div className="text-left">
                <DrawerTitle className="text-xl font-display font-semibold">{plant.name}</DrawerTitle>
                {plant.latin && (
                  <DrawerDescription className="text-primary/60 italic font-display text-sm">{plant.latin}</DrawerDescription>
                )}
              </div>
            </div>
          </DrawerHeader>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
              <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-display font-semibold text-foreground">{wateringLogs.length}</p>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Waterings</p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
              <TrendingUp className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-display font-semibold text-foreground">{growthLogs.length}</p>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Growth Logs</p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
              <Droplets className="w-4 h-4 mx-auto mb-1" style={{ color: daysSinceWater !== null && daysSinceWater > 7 ? "hsl(var(--destructive))" : "hsl(var(--primary))" }} />
              <p className="text-lg font-display font-semibold text-foreground">
                {daysSinceWater !== null ? `${daysSinceWater}d` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Since Water</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-5">
            {(["water", "growth"] as const).map((t) => (
              <motion.button
                key={t}
                onClick={() => setTab(t)}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 py-2 rounded-xl text-xs font-body tracking-wider uppercase border transition-all duration-300 ${
                  tab === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {t === "water" ? "💧 Watering" : "📈 Growth"}
              </motion.button>
            ))}
          </div>

          {/* Watering tab */}
          {tab === "water" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Quick log */}
              <div className="flex gap-2">
                <Input
                  value={waterNote}
                  onChange={(e) => setWaterNote(e.target.value)}
                  placeholder="Add a note (optional)…"
                  className="font-body text-sm bg-card/60 border-border/60"
                />
                <Button
                  onClick={logWatering}
                  disabled={addingWater}
                  className="shrink-0 font-body text-xs tracking-wider uppercase"
                >
                  {addingWater ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Droplets className="w-3.5 h-3.5 mr-1.5" /> Water</>
                  )}
                </Button>
              </div>

              {/* Log list */}
              <div className="space-y-2">
                <AnimatePresence>
                  {wateringLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 group"
                    >
                      <Droplets className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground font-body">
                          {new Date(log.watered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {log.notes && <p className="text-[11px] text-muted-foreground font-body truncate">{log.notes}</p>}
                      </div>
                      <button
                        onClick={() => deleteWaterLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!loading && wateringLogs.length === 0 && (
                  <p className="text-center text-muted-foreground/50 text-sm font-body py-6">No watering logs yet. Tap "Water" to start tracking!</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Growth tab */}
          {tab === "growth" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {!showGrowthForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowGrowthForm(true)}
                  className="w-full font-body text-xs tracking-wider uppercase border-primary/30 hover:bg-primary/10"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Growth
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/40"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1 block">Height (cm)</label>
                      <Input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="e.g. 25"
                        className="font-body text-sm bg-card/60 border-border/60"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1 block">Leaf count</label>
                      <Input
                        type="number"
                        value={leafCount}
                        onChange={(e) => setLeafCount(e.target.value)}
                        placeholder="e.g. 12"
                        className="font-body text-sm bg-card/60 border-border/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1.5 block">Health Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {HEALTH_OPTIONS.map((h) => (
                        <button
                          key={h.value}
                          onClick={() => setHealth(h.value)}
                          className={`px-3 py-1 rounded-full text-[11px] font-body border transition-all ${
                            health === h.value ? h.color : "border-border text-muted-foreground"
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    value={growthNote}
                    onChange={(e) => setGrowthNote(e.target.value)}
                    placeholder="Notes (optional)…"
                    className="font-body text-sm bg-card/60 border-border/60 min-h-[60px]"
                  />

                  <div className="flex gap-2">
                    <Button onClick={logGrowth} disabled={addingGrowth} className="flex-1 font-body text-xs tracking-wider uppercase">
                      {addingGrowth ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Save"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowGrowthForm(false)} className="font-body text-xs">Cancel</Button>
                  </div>
                </motion.div>
              )}

              {/* Growth log list */}
              <div className="space-y-2">
                <AnimatePresence>
                  {growthLogs.map((log) => {
                    const healthOpt = HEALTH_OPTIONS.find((h) => h.value === log.health);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="p-3 rounded-xl bg-muted/30 border border-border/30 group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-foreground font-body">
                            {new Date(log.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <div className="flex items-center gap-2">
                            {healthOpt && (
                              <span className={`text-[10px] font-body px-2 py-0.5 rounded-full border ${healthOpt.color}`}>
                                {healthOpt.label}
                              </span>
                            )}
                            <button
                              onClick={() => deleteGrowthLog(log.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-4 text-[11px] text-muted-foreground font-body">
                          {log.height_cm != null && <span>📏 {log.height_cm} cm</span>}
                          {log.leaf_count != null && <span>🍃 {log.leaf_count} leaves</span>}
                        </div>
                        {log.notes && <p className="text-[11px] text-muted-foreground/70 font-body mt-1">{log.notes}</p>}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {!loading && growthLogs.length === 0 && (
                  <p className="text-center text-muted-foreground/50 text-sm font-body py-6">No growth logs yet. Start tracking your plant's progress!</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default GardenItemDrawer;
