import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Leaf, Trash2, Search } from "lucide-react";

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
      .select("id, plant_id, added_at, plants(id, name, latin, description, care_instructions, light_requirements, watering_frequency, image_url)")
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
            Your collection of saved plants.
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
                    <p className="text-xs text-muted-foreground font-body">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full font-body text-xs tracking-widest uppercase"
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
