import { Leaf, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/50">
      <div className="container px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-wide">VELVET</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Collection", "Care Guides", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 font-body"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="font-body text-xs tracking-widest uppercase text-primary"
            >
              <Shield className="w-4 h-4 mr-1" /> Admin
            </Button>
          )}
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="font-body text-xs tracking-widest uppercase"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase rounded-sm hover:bg-emerald-glow transition-colors duration-300 font-body"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
