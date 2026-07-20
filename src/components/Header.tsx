import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  
  return (
    <header className="safe-area-top sticky top-0 z-[2000] border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto px-4 py-3 sm:px-6">
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Link
            to="/home"
            aria-label="QuickER home"
            className="flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo className="h-9 max-w-[10.5rem]" />
          </Link>
          
          <nav className={`hidden md:flex items-center space-x-8 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              {t('nav.about')}
            </Link>
            <Link to="/settings" className="text-foreground hover:text-primary transition-colors">
              {t('nav.settings')}
            </Link>
          </nav>
          
          <div className={`flex shrink-0 items-center space-x-2 sm:space-x-4 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
            {location.pathname !== '/' &&
              location.pathname !== '/get-started' &&
              location.pathname !== '/onboarding' && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                asChild
              >
                <Link to="/get-started">{t('btn.getStarted')}</Link>
              </Button>
            )}
            <Button size="sm" variant="emergency" asChild>
              <Link to="/home">{t('btn.emergency')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
