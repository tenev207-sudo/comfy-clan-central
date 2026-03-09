import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Leaf, Menu, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import CartDrawer from "@/components/CartDrawer";

const Navbar = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navLinks = [
    { label: "Как работи", href: "/#how-it-works" },
    { label: "Оферти", href: "/#offers" },
    { label: "За търговци", href: "/#merchants" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.slice(2);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          SmartBiteSZ
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => handleNavClick(e, l.href)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}

          <CartDrawer />

          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {user.email?.split("@")[0]}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
                <LogOut className="h-4 w-4" /> Изход
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-1">
                <User className="h-4 w-4" /> Влез / Регистрация
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <CartDrawer />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle>Меню</SheetTitle>
              <div className="flex flex-col gap-4 mt-6">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} onClick={(e) => handleNavClick(e, l.href)} className="text-lg font-medium text-foreground">
                    {l.label}
                  </a>
                ))}
                {user ? (
                  <Button variant="outline" onClick={() => { handleLogout(); setOpen(false); }} className="gap-2 mt-4">
                    <LogOut className="h-4 w-4" /> Изход
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button className="w-full gap-2 mt-4">
                      <User className="h-4 w-4" /> Вход / Регистрация
                    </Button>
                  </Link>
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
