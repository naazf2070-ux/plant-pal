import { useState } from "react";
import { Leaf, Shield, Menu, X, FlowerIcon, TreePine, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const publicLinks = [
  { label: "Collection", href: "#collection" },
  { label: "Care Guides", href: "#care-guides" },
  { label: "About", href: "#about" },
];

const userLinks = [
  { label: "Search Plants", href: "/plants", icon: FlowerIcon },
  { label: "My Garden", href: "/garden", icon: TreePine },
];

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  const handleNav = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-md border-b border-border/50">
      <div className="container px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleNav("/")}
        >
          <Leaf className="w-5 h-5 text-primary transition-transform group-hover:rotate-12 duration-300" />
          <span className="font-display text-lg font-semibold tracking-widest text-foreground">
            VELVET
          </span>
        </div>

        {/* Desktop Nav — centered */}
        <div className="hidden md:flex items-center gap-8">
          {publicLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 font-body"
            >
              {item.label}
            </a>
          ))}

          {user && (
            <>
              <span className="w-px h-3.5 bg-border/60" />
              {userLinks.map(({ label, href }) => (
                <button
                  key={label}
                  onClick={() => handleNav(href)}
                  className={cn(
                    "text-[11px] tracking-[0.2em] uppercase transition-colors duration-200 font-body",
                    isActive(href)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className={cn(
                "h-8 w-8",
                isActive("/admin") ? "text-primary" : "text-primary/70 hover:text-primary"
              )}
              title="Admin"
            >
              <Shield className="w-4 h-4" />
            </Button>
          )}

          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="font-body text-[11px] tracking-[0.15em] uppercase bg-primary text-primary-foreground hover:bg-emerald-glow transition-colors duration-300 rounded-sm h-8 px-4"
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-border/60 flex flex-col pt-16 px-0">
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 px-6 mb-8">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="font-display text-base font-semibold tracking-widest">VELVET</span>
              </div>

              {/* Public links */}
              <div className="flex flex-col px-6 gap-1">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 font-body mb-2">
                  Explore
                </p>
                {publicLinks.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.href)}
                    className="text-left text-sm tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 font-body py-2 border-b border-border/20"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* User links */}
              {user && (
                <div className="flex flex-col px-6 gap-1 mt-6">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 font-body mb-2">
                    My Account
                  </p>
                  {userLinks.map(({ label, href, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => handleNav(href)}
                      className={cn(
                        "flex items-center gap-2.5 text-left text-sm tracking-[0.12em] uppercase transition-colors duration-200 font-body py-2 border-b border-border/20",
                        isActive(href) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Admin link */}
              {isAdmin && (
                <div className="flex flex-col px-6 gap-1 mt-6">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 font-body mb-2">
                    Administration
                  </p>
                  <button
                    onClick={() => { setOpen(false); navigate("/admin"); }}
                    className={cn(
                      "flex items-center gap-2.5 text-left text-sm tracking-[0.12em] uppercase transition-colors duration-200 font-body py-2",
                      isActive("/admin") ? "text-primary" : "text-primary/70 hover:text-primary"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </button>
                </div>
              )}

              {/* Sign In / Out */}
              <div className="mt-auto px-6 pb-8">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full font-body text-xs tracking-widest uppercase border-border/60"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <Button
                    className="w-full font-body text-xs tracking-widest uppercase bg-primary text-primary-foreground hover:bg-emerald-glow rounded-sm"
                    onClick={() => { setOpen(false); navigate("/auth"); }}
                  >
                    <LogIn className="w-3.5 h-3.5 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
