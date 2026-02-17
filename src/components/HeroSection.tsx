import heroImage from "@/assets/hero-plant.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Lush monstera plant with water droplets"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl space-y-8">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground animate-fade-in font-body">
            Premium Plant Care
          </p>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.9] tracking-tight animate-fade-in-up">
            <span className="text-gradient-emerald">VEL</span>
            <br />
            <span className="text-foreground">VET</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: "0.2s" }}>
            Nurture your green companions with expert guidance. 
            Discover the art of plant care that transforms any space into a living sanctuary.
          </p>
          <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <a
              href="#collection"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground font-body text-sm tracking-widest uppercase rounded-sm hover:bg-emerald-glow transition-colors duration-300"
            >
              Explore
            </a>
            <a
              href="#about"
              className="inline-block px-8 py-3 border border-border text-foreground font-body text-sm tracking-widest uppercase rounded-sm hover:border-primary hover:text-primary transition-colors duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
