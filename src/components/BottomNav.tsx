import { Home, Compass, PlusCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
        <NavLink
          to="/"
          className="flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Ana Sayfa</span>
        </NavLink>

        <NavLink
          to="/explore"
          className="flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Compass className="w-6 h-6" />
          <span className="text-xs">Keşfet</span>
        </NavLink>

        <NavLink
          to="/new-recipe"
          className="flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <PlusCircle className="w-7 h-7" />
          <span className="text-xs">Yeni</span>
        </NavLink>

        <NavLink
          to="/profile"
          className="flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <User className="w-6 h-6" />
          <span className="text-xs">Profil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
