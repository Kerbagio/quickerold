import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Header = () => {
  const { t, language } = useLanguage();
  
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo-quicker.svg" 
              alt="QuickER Logo" 
              className="h-8 w-auto"
            />
          </Link>
          
          <nav className={`hidden md:flex items-center space-x-8 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
              {t('nav.dashboard')}
            </Link>
            <Link to="/health-assistant" className="text-foreground hover:text-primary transition-colors">
              Health Assistant
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              {t('nav.about')}
            </Link>
            <Link to="/settings" className="text-foreground hover:text-primary transition-colors">
              {t('nav.settings')}
            </Link>
          </nav>
          
          <div className={`flex items-center space-x-4 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
            <Button variant="outline" size="sm" asChild>
              <Link to="/onboarding">{t('btn.getStarted')}</Link>
            </Button>
            <Button size="sm" variant="emergency" asChild>
              <Link to="/">{t('btn.emergency')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;