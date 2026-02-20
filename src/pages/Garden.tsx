import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Leaf, Trash2, Search, CalendarDays } from "lucide-react";

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const plant = item.plants;
              return (
                <div
                  key={item.id}
                  className="group relative rounded-[20px] overflow-hidden flex flex-col"
                  style={{
                    background: "hsl(0 0% 9%)",
                    boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5)",
                  }}
                >
                  {/* Inner image box */}
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
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 font-body">
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        {new Date(item.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <button
                        onClick={() => removeFromGarden(item.id)}
                        disabled={removingId === item.id}
                        title="Remove from garden"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all duration-200 shrink-0"
                      >
                        {removingId === item.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
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
