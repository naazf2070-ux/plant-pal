import plant1 from "@/assets/plant-1.jpg";
import plant2 from "@/assets/plant-2.jpg";
import plant3 from "@/assets/plant-3.jpg";

const plants = [
  {
    image: plant1,
    name: "Fiddle Leaf Fig",
    latin: "Ficus lyrata",
    care: "Bright indirect light · Water weekly",
  },
  {
    image: plant2,
    name: "Snake Plant",
    latin: "Sansevieria trifasciata",
    care: "Low to bright light · Water bi-weekly",
  },
  {
    image: plant3,
    name: "Philodendron",
    latin: "Philodendron hederaceum",
    care: "Medium indirect light · Keep soil moist",
  },
];

const CollectionSection = () => {
  return (
    <section id="collection" className="py-24 md:py-32">
      <div className="container px-6 md:px-12 lg:px-20">
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">Featured Collection</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold">
            Become a <span className="italic text-gradient-gold">favorite</span> of your guests
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">
            Curated selection of indoor plants perfect for any living space, with complete care guidance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {plants.map((plant, index) => (
            <div
              key={plant.name}
              className="group relative bg-gradient-card rounded-sm overflow-hidden border border-border hover:border-primary/40 transition-all duration-500"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-display font-semibold">{plant.name}</h3>
                <p className="text-primary text-sm italic font-display">{plant.latin}</p>
                <p className="text-muted-foreground text-sm font-light pt-1">{plant.care}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionSection;
