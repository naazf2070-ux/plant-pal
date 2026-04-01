import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Leaf, Plus, Check, Droplets, Sun, Sprout } from "lucide-react";
import PlantDetailDrawer from "@/components/PlantDetailDrawer";

interface Plant {
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
}

const FILTER_TYPES = ["All", "Indoor", "Outdoor", "Both"];

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.3 } },
};

const SkeletonCard = () => (
  <div className="rounded-[20px] overflow-hidden bg-card animate-pulse">
    <div className="mx-3 mt-3 rounded-[14px] bg-muted h-[190px]" />
    <div className="px-4 pt-3 pb-4 space-y-2">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  </div>
);

const Plants = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gardenIds, setGardenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  useEffect(() => { fetchPlants(); }, []);
  useEffect(() => { if (user) fetchGardenIds(); }, [user]);

  const fetchPlants = async () => {
    setLoading(true);
    const { data } = await supabase.from("plants").select("*").order("name");
    if (data) setPlants(data as Plant[]);
    setLoading(false);
  };

  const fetchGardenIds = async () => {
    const { data } = await supabase.from("garden_items").select("plant_id");
    if (data) setGardenIds(new Set(data.map((g) => g.plant_id)));
  };

  const addToGarden = async (plantId: string) => {
    if (!user) {
      toast({ title: "Sign in to add to your garden", variant: "destructive" });
      return;
    }
    setAddingId(plantId);
    const { error } = await supabase.from("garden_items").insert({ user_id: user.id, plant_id: plantId });
    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
    } else {
      setGardenIds((prev) => new Set([...prev, plantId]));
      toast({ title: "Added to My Garden 🌿" });
    }
    setAddingId(null);
  };

  const filtered = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.latin || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.plant_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-20 pt-28 pb-20">
        {/* Header with animation */}
        <motion.div
          className="mb-12 text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">Explore</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold">Search Plants</h1>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Browse our curated collection and add your favorites to My Garden.
          </p>
        </motion.div>

        {/* Search + filters */}
        <motion.div
          className="max-w-2xl mx-auto mb-10 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, latin name, category…"
              className="pl-11 font-body h-12 bg-card/60 border-border/60 focus:border-primary/50 focus:bg-card transition-all duration-300"
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {FILTER_TYPES.map((t) => (
              <motion.button
                key={t}
                onClick={() => setTypeFilter(t)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-1.5 rounded-full text-xs font-body tracking-wider uppercase border transition-all duration-300 ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_hsl(145_50%_38%/0.25)]"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-20 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Leaf className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            </motion.div>
            <p className="text-muted-foreground font-body text-lg">No plants found.</p>
            <p className="text-muted-foreground/60 font-body text-sm">Try adjusting your search or filters.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((plant, i) => {
                const inGarden = gardenIds.has(plant.id);
                return (
                  <motion.div
                    key={plant.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    onClick={() => setSelectedPlant(plant)}
                    className="group relative rounded-[20px] overflow-hidden flex flex-col cursor-pointer"
                    style={{
                      background: "hsl(var(--card))",
                      boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5)",
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  >
                    {/* Inner image box */}
                    <div className="relative mx-3 mt-3 rounded-[14px] flex items-center justify-center overflow-hidden bg-muted" style={{ minHeight: "190px" }}>
                      {plant.image_url ? (
                        <img
                          src={plant.image_url}
                          alt={plant.name}
                          className="w-full h-full object-contain max-h-[190px] p-3 group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-2xl"
                        />
                      ) : (
                        <Leaf className="w-16 h-16 text-muted-foreground/20 my-10" />
                      )}
                      {plant.category && (
                        <span className="absolute top-2.5 right-2.5 text-[9px] tracking-wider uppercase font-body bg-card/80 backdrop-blur-sm text-muted-foreground border border-border/60 rounded-full px-2 py-0.5">
                          {plant.category}
                        </span>
                      )}
                    </div>

                    {/* Info section */}
                    <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
                      <h3 className="text-[15px] font-display font-semibold leading-snug text-foreground">
                        {plant.name}
                      </h3>
                      {plant.description && (
                        <p className="text-muted-foreground text-[11px] font-body mt-1 line-clamp-2 leading-relaxed">
                          {plant.description}
                        </p>
                      )}

                      {/* Care icons */}
                      <div className="flex gap-2 mt-2.5">
                        {plant.light_requirements && (
                          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70 font-body" title={plant.light_requirements}>
                            <Sun className="w-3 h-3 text-gold" /> {plant.light_requirements.split(" ")[0]}
                          </span>
                        )}
                        {plant.watering_frequency && (
                          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70 font-body" title={plant.watering_frequency}>
                            <Droplets className="w-3 h-3 text-primary" /> {plant.watering_frequency.split(" ")[0]}
                          </span>
                        )}
                        {plant.soil_type && (
                          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70 font-body" title={plant.soil_type}>
                            <Sprout className="w-3 h-3 text-accent" /> {plant.soil_type.split(" ")[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-h-[8px]" />

                      {/* Bottom row */}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {plant.latin ? (
                            <p className="text-[11px] italic font-display text-primary/60">{plant.latin}</p>
                          ) : plant.plant_type ? (
                            <p className="text-[11px] font-body text-muted-foreground/60">{plant.plant_type}</p>
                          ) : null}
                        </div>
                        <motion.button
                          onClick={() => !inGarden && addToGarden(plant.id)}
                          disabled={inGarden || addingId === plant.id}
                          title={inGarden ? "In My Garden" : "Add to My Garden"}
                          whileHover={!inGarden ? { scale: 1.15 } : {}}
                          whileTap={!inGarden ? { scale: 0.9 } : {}}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
                            inGarden
                              ? "bg-primary/15 text-primary"
                              : "bg-muted/60 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_12px_hsl(145_50%_38%/0.3)] text-muted-foreground"
                          }`}
                        >
                          {inGarden ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : addingId === plant.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Plants;
