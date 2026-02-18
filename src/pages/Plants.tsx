import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

const Plants = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [search, setSearch] = useState("");
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
    if (data) setPlants(data);
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

  const filtered = plants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.latin || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

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

        <div className="relative max-w-xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, latin name, or description…"
            className="pl-11 font-body"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading plants…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Leaf className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground font-body">No plants found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((plant) => {
              const inGarden = gardenIds.has(plant.id);
              return (
                <div
                  key={plant.id}
                  className="group bg-gradient-card rounded-sm border border-border hover:border-primary/40 transition-all duration-300 overflow-hidden"
                >
                  {plant.image_url ? (
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={plant.image_url}
                        alt={plant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted/30 flex items-center justify-center">
                      <Leaf className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-xl font-display font-semibold">{plant.name}</h3>
                      {plant.latin && <p className="text-primary text-sm italic font-display">{plant.latin}</p>}
                    </div>
                    {plant.description && (
                      <p className="text-muted-foreground text-sm font-light line-clamp-2">{plant.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {plant.light_requirements && (
                        <Badge variant="secondary" className="text-xs font-body">{plant.light_requirements}</Badge>
                      )}
                      {plant.watering_frequency && (
                        <Badge variant="outline" className="text-xs font-body">{plant.watering_frequency}</Badge>
                      )}
                    </div>
                    {plant.care_instructions && (
                      <p className="text-xs text-muted-foreground font-body border-t border-border/50 pt-3">{plant.care_instructions}</p>
                    )}
                    <Button
                      size="sm"
                      variant={inGarden ? "secondary" : "default"}
                      className="w-full font-body text-xs tracking-widest uppercase"
                      onClick={() => !inGarden && addToGarden(plant.id)}
                      disabled={inGarden || addingId === plant.id}
                    >
                      {inGarden ? (
                        <><Check className="w-3 h-3 mr-1" /> In My Garden</>
                      ) : (
                        <><Plus className="w-3 h-3 mr-1" /> Add to My Garden</>
                      )}
                    </Button>
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
