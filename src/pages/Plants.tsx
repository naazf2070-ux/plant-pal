import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Leaf, Plus, Check } from "lucide-react";

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((plant) => {
              const inGarden = gardenIds.has(plant.id);
              return (
                <div
                  key={plant.id}
                  className="group relative rounded-[20px] overflow-hidden flex flex-col"
                  style={{
                    background: "hsl(0 0% 9%)",
                    boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5)",
                  }}
                >
                  {/* Inner image box — rounded, inset, slightly lighter */}
                  <div
                    className="relative mx-3 mt-3 rounded-[14px] flex items-center justify-center overflow-hidden"
                    style={{
                      background: "hsl(0 0% 13%)",
                      minHeight: "190px",
                    }}
                  >
                    {plant.image_url ? (
                      <img
                        src={plant.image_url}
                        alt={plant.name}
                        className="w-full h-full object-contain max-h-[190px] p-3 group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
                      />
                    ) : (
                      <Leaf className="w-16 h-16 text-muted-foreground/20 my-10" />
                    )}
                    {/* Category pill */}
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

                    <div className="flex-1 min-h-[12px]" />

                    {/* Bottom row */}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        {plant.latin ? (
                          <p className="text-[11px] italic font-display text-primary/60">{plant.latin}</p>
                        ) : plant.plant_type ? (
                          <p className="text-[11px] font-body text-muted-foreground/60">{plant.plant_type}</p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => !inGarden && addToGarden(plant.id)}
                        disabled={inGarden || addingId === plant.id}
                        title={inGarden ? "In My Garden" : "Add to My Garden"}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                          inGarden
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/60 hover:bg-primary hover:text-primary-foreground text-muted-foreground"
                        }`}
                      >
                        {inGarden ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : addingId === plant.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
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
