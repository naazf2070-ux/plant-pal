import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Leaf, Trash2, Search, CalendarDays, Droplets, Sun, Sprout } from "lucide-react";
import GardenItemDrawer from "@/components/GardenItemDrawer";

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

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
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

const Garden = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<GardenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GardenItem | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchGarden();
  }, [user]);

  const fetchGarden = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("garden_items")
      .select("id, plant_id, added_at, plants(id, name, latin, description, care_instructions, light_requirements, watering_frequency, image_url, category, plant_type, soil_type)")
      .order("added_at", { ascending: false });
    if (data) setItems(data as GardenItem[]);
    setLoading(false);
  };

  const removeFromGarden = async (itemId: string) => {
    setRemovingId(itemId);
    const { error } = await supabase.from("garden_items").delete().eq("id", itemId);
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast({ title: "Removed from garden" });
    }
    setRemovingId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Leaf className="w-8 h-8 text-primary animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-20 pt-28 pb-20">
        <motion.div
          className="mb-12 text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">Personal</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold">My Garden</h1>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Your collection of saved plants — <span className="text-primary font-medium">{items.length}</span> {items.length === 1 ? "plant" : "plants"} growing.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            className="text-center py-20 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Leaf className="w-20 h-20 text-primary/20 mx-auto" />
            </motion.div>
            <div className="space-y-2">
              <p className="text-foreground font-display text-xl font-semibold">Your garden awaits</p>
              <p className="text-muted-foreground font-body text-sm max-w-xs mx-auto">
                Start building your personal collection by browsing our plant catalog.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/plants")}
              className="font-body text-xs tracking-widest uppercase border-primary/30 hover:bg-primary/10 hover:border-primary"
            >
              <Search className="w-3 h-3 mr-2" /> Browse Plants
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item, i) => {
                const plant = item.plants;
                return (
                  <motion.div
                    key={item.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="group relative rounded-[20px] overflow-hidden flex flex-col cursor-pointer"
                    onClick={() => setSelectedItem(item)}
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
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 font-body">
                          <CalendarDays className="w-3 h-3 shrink-0" />
                          {new Date(item.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <motion.button
                          onClick={() => removeFromGarden(item.id)}
                          disabled={removingId === item.id}
                          title="Remove from garden"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all duration-300 shrink-0"
                        >
                          {removingId === item.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
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

export default Garden;
