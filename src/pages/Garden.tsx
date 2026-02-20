import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Leaf, Trash2, Search, Droplets, Sun, CalendarDays } from "lucide-react";

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

const Garden = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<GardenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
        <p className="text-muted-foreground font-body">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-20 pt-28 pb-20">
        <div className="mb-12 text-center space-y-4">
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">Personal</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold">My Garden</h1>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Your collection of saved plants — {items.length} {items.length === 1 ? "plant" : "plants"} growing.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading your garden…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Leaf className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-body">Your garden is empty.</p>
            <Button variant="outline" onClick={() => navigate("/plants")} className="font-body text-xs tracking-widest uppercase">
              <Search className="w-3 h-3 mr-2" /> Browse Plants
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => {
              const plant = item.plants;
              return (
                <div
                  key={item.id}
                  className="group relative bg-card rounded-2xl border border-border/60 hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col"
                  style={{ boxShadow: "0 4px 24px 0 hsl(0 0% 0% / 0.4)" }}
                >
                  {/* Image area */}
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
                    {/* Category pill */}
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

                    {/* Care pills */}
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

                    {/* Bottom row: added date + remove icon */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(item.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <button
                        onClick={() => removeFromGarden(item.id)}
                        disabled={removingId === item.id}
                        className="w-9 h-9 rounded-xl flex items-center justify-center border border-border hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive text-muted-foreground transition-all duration-200"
                        title="Remove from garden"
                      >
                        {removingId === item.id ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
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

export default Garden;
