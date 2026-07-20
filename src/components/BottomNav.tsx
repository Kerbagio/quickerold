import { Home, Settings, BarChart3, Filter, BrainCircuit } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { t, language } = useLanguage();
  
  const navItems = [
    { 
      path: "/home", 
      icon: Home, 
      label: t('nav.home'),
      isActive: location.pathname === "/home"
    },
    { 
      path: "/options", 
      icon: Filter, 
      label: t('nav.options'),
      isActive: location.pathname === "/options"
    },
    { 
      path: "/health-assistant", 
      icon: BrainCircuit,
      label: "Agent",
      isActive: location.pathname === "/health-assistant"
    },
    { 
      path: "/dashboard", 
      icon: BarChart3, 
      label: t('nav.dashboard'),
      isActive: location.pathname === "/dashboard"
    },
    { 
      path: "/settings", 
      icon: Settings, 
      label: t('nav.settings'),
      isActive: location.pathname === "/settings"
    },
  ];

  // Keep the first-run experience focused before showing app navigation.
  if (
    location.pathname === "/" ||
    location.pathname === "/get-started" ||
    location.pathname === "/onboarding" ||
    location.pathname === "/about"
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className={`fixed bottom-0 left-0 right-0 z-[2000] border-t border-border/80 bg-background/95 shadow-[0_-10px_30px_-18px_hsl(var(--foreground)/0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 ${language === 'ar' ? 'rtl' : ''}`}
    >
      <div
        className="mx-auto flex max-w-md items-center justify-around px-2 pt-2"
        style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            aria-current={item.isActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center rounded-xl p-2 transition-colors",
              item.isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
