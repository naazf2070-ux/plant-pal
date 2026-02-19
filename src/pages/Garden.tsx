import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Leaf, Trash2, Search, Droplets, Sun, Sprout, TreeDeciduous, CalendarDays } from "lucide-react";

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const plant = item.plants;
              return (
                <div
                  key={item.id}
                  className="group bg-gradient-card rounded-sm border border-border hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  {plant.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={plant.image_url}
                        alt={plant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
                      <Leaf className="w-14 h-14 text-muted-foreground/20" />
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    {/* Name + category */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-display font-semibold leading-tight">{plant.name}</h3>
                        {plant.latin && <p className="text-primary text-sm italic font-display mt-0.5">{plant.latin}</p>}
                      </div>
                      {plant.category && (
                        <Badge className="shrink-0 text-xs font-body bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          {plant.category}
                        </Badge>
                      )}
                    </div>

                    {/* Type badge */}
                    {plant.plant_type && (
                      <div>
                        <Badge variant="outline" className="text-xs font-body">
                          <TreeDeciduous className="w-3 h-3 mr-1" />
                          {plant.plant_type}
                        </Badge>
                      </div>
                    )}

                    {/* Description */}
                    {plant.description && (
                      <p className="text-muted-foreground text-sm font-light line-clamp-2">{plant.description}</p>
                    )}

                    {/* Care info */}
                    {(plant.light_requirements || plant.watering_frequency || plant.soil_type) && (
                      <div className="grid grid-cols-1 gap-1.5 border border-border/50 rounded-sm p-3 bg-muted/20">
                        {plant.light_requirements && (
                          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                            <Sun className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{plant.light_requirements}</span>
                          </div>
                        )}
                        {plant.watering_frequency && (
                          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                            <Droplets className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{plant.watering_frequency}</span>
                          </div>
                        )}
                        {plant.soil_type && (
                          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                            <Sprout className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{plant.soil_type} soil</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Added date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                      <CalendarDays className="w-3 h-3" />
                      Added {new Date(item.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>

                    {/* Remove button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full font-body text-xs tracking-widest uppercase border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFromGarden(item.id)}
                      disabled={removingId === item.id}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {removingId === item.id ? "Removing…" : "Remove from Garden"}
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

export default Garden;
