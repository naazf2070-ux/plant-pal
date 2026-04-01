import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Leaf, Droplets, Sun, Sprout, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

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

interface PlantDetailDrawerProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40"
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body">{label}</p>
      <p className="text-sm text-foreground font-body mt-0.5">{value}</p>
    </div>
  </motion.div>
);

const PlantDetailDrawer = ({ plant, open, onOpenChange }: PlantDetailDrawerProps) => {
  if (!plant) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-background border-border">
        <div className="overflow-y-auto px-6 pb-8">
          <DrawerHeader className="px-0 pt-4">
            <div className="flex items-center gap-3">
              {plant.category && (
                <span className="text-[10px] tracking-wider uppercase font-body bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  {plant.category}
                </span>
              )}
              {plant.plant_type && (
                <span className="text-[10px] tracking-wider uppercase font-body bg-muted text-muted-foreground border border-border rounded-full px-2.5 py-0.5">
                  {plant.plant_type}
                </span>
              )}
            </div>
            <DrawerTitle className="text-2xl font-display font-semibold text-left mt-2">
              {plant.name}
            </DrawerTitle>
            {plant.latin && (
              <DrawerDescription className="text-primary/70 italic font-display text-left text-base">
                {plant.latin}
              </DrawerDescription>
            )}
          </DrawerHeader>

          <div className="flex flex-col md:flex-row gap-6 mt-2">
            {/* Image */}
            <div className="md:w-1/3 shrink-0">
              <div className="rounded-2xl overflow-hidden bg-muted flex items-center justify-center aspect-square">
                {plant.image_url ? (
                  <img src={plant.image_url} alt={plant.name} className="w-full h-full object-contain p-4 drop-shadow-2xl" />
                ) : (
                  <Leaf className="w-20 h-20 text-muted-foreground/20" />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              {plant.description && (
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{plant.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plant.light_requirements && (
                  <InfoCard icon={Sun} label="Light" value={plant.light_requirements} color="bg-yellow-500/10 text-yellow-500" />
                )}
                {plant.watering_frequency && (
                  <InfoCard icon={Droplets} label="Watering" value={plant.watering_frequency} color="bg-primary/10 text-primary" />
                )}
                {plant.soil_type && (
                  <InfoCard icon={Sprout} label="Soil" value={plant.soil_type} color="bg-accent/10 text-accent" />
                )}
              </div>

              {plant.care_instructions && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body">Care Instructions</p>
                  </div>
                  <p className="text-sm text-foreground font-body leading-relaxed">{plant.care_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PlantDetailDrawer;
