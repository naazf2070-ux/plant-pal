import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Leaf, Plus, Check, Droplets, Sun } from "lucide-react";

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

const Plants = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gardenIds, setGardenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (user) fetchGardenIds();
  }, [user]);

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
        <div className="mb-12 text-center space-y-4">
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">Explore</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold">Search Plants</h1>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Browse our curated collection and add your favorites to My Garden.
          </p>
        </div>

        {/* Search + filters */}
        <div className="max-w-2xl mx-auto mb-10 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, latin name, category…"
              className="pl-11 font-body"
            />
          </div>
          {/* Type filter chips */}
          <div className="flex gap-2 flex-wrap justify-center">
            {FILTER_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-body tracking-wider uppercase border transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading plants…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Leaf className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground font-body">No plants found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((plant) => {
              const inGarden = gardenIds.has(plant.id);
              return (
                <div
                  key={plant.id}
                  className="group relative bg-card rounded-2xl border border-border/60 hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col"
                  style={{ boxShadow: "0 4px 24px 0 hsl(0 0% 0% / 0.4)" }}
                >
                  {/* Image area — contained, centered like the reference */}
                  <div className="relative flex items-center justify-center bg-muted/20 pt-6 px-4 pb-2 min-h-[180px]">
                    {plant.image_url ? (
                      <img
                        src={plant.image_url}
                        alt={plant.name}
                        className="h-40 w-auto object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Leaf className="w-16 h-16 text-muted-foreground/20" />
                    )}
                    {/* Category pill top-right */}
                    {plant.category && (
                      <span className="absolute top-3 right-3 text-[10px] tracking-wider uppercase font-body bg-primary/15 text-primary border border-primary/20 rounded-full px-2 py-0.5">
                        {plant.category}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
                    <h3 className="text-base font-display font-semibold leading-tight">{plant.name}</h3>
                    {plant.latin && (
                      <p className="text-primary/70 text-xs italic font-display mt-0.5">{plant.latin}</p>
                    )}
                    {plant.description && (
                      <p className="text-muted-foreground text-xs font-body mt-2 line-clamp-2 leading-relaxed">
                        {plant.description}
                      </p>
                    )}

                    {/* Care pills row */}
                    {(plant.light_requirements || plant.watering_frequency) && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {plant.light_requirements && (
                          <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
                            <Sun className="w-2.5 h-2.5 text-primary" />
                            {plant.light_requirements}
                          </span>
                        )}
                        {plant.watering_frequency && (
                          <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
                            <Droplets className="w-2.5 h-2.5 text-primary" />
                            {plant.watering_frequency}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Bottom row: type tag + add button */}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-body text-muted-foreground">
                        {plant.plant_type || "—"}
                      </span>
                      <button
                        onClick={() => !inGarden && addToGarden(plant.id)}
                        disabled={inGarden || addingId === plant.id}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                          inGarden
                            ? "bg-primary/10 border-primary/30 text-primary cursor-default"
                            : "bg-card border-border hover:bg-primary hover:border-primary hover:text-primary-foreground text-muted-foreground"
                        }`}
                        title={inGarden ? "In My Garden" : "Add to My Garden"}
                      >
                        {inGarden ? (
                          <Check className="w-4 h-4" />
                        ) : addingId === plant.id ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Plants;
