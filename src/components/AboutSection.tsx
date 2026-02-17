import leavesDetail from "@/assets/leaves-detail.jpg";
import { Droplets, Sun, Wind } from "lucide-react";

const features = [
  {
    icon: Droplets,
    title: "Precise Watering",
    description: "Learn the exact watering schedules for each species to keep roots healthy and foliage thriving.",
  },
  {
    icon: Sun,
    title: "Light Optimization",
    description: "Position your plants for ideal light exposure, from bright indirect to gentle shade lovers.",
  },
  {
    icon: Wind,
    title: "Climate Control",
    description: "Master humidity and temperature to recreate the natural habitats your plants crave.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 md:py-32 bg-gradient-dark">
      <div className="container px-6 md:px-12 lg:px-20">
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-24">
          <div className="space-y-6">
            <p className="text-sm tracking-[0.3em] uppercase text-primary font-body">Our Philosophy</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              The art of <span className="italic text-gradient-gold">nurturing</span> green life
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed text-lg font-light">
              Every plant tells a story. We combine botanical science with intuitive care practices 
              to help you build a deeper connection with your indoor garden.
            </p>
            <p className="text-muted-foreground leading-relaxed font-light">
              From tropical monstera to resilient succulents, our premium care guides ensure 
              your plants don't just survive — they flourish.
            </p>
          </div>
        </div>

        {/* Image + Features */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-sm overflow-hidden aspect-video">
            <img
              src={leavesDetail}
              alt="Close-up of green leaves with morning dew"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          <div className="space-y-10">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-5 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-sm bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground font-light text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
