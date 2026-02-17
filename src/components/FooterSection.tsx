import { Leaf } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container px-6 md:px-12 lg:px-20">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              <span className="font-display text-xl font-semibold tracking-wide">VELVET</span>
            </div>
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              Premium plant care guidance for the modern indoor gardener.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Navigate</h4>
            <ul className="space-y-2">
              {["Collection", "Care Guides", "About", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-200 font-light">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Connect</h4>
            <p className="text-sm text-foreground/70 font-light">hello@velvetplants.com</p>
            <p className="text-sm text-foreground/70 font-light">Follow us on Instagram</p>
          </div>
        </div>
        <div className="mt-16 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground font-light tracking-wider">
            © 2026 Velvet Plant Care. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
