import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Globe, Shield, Database, FileText, Trash2, Download, ExternalLink, Palette } from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { clearPageMemory } from "@/hooks/usePageMemory";

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [defaultEmergencyType, setDefaultEmergencyType] = useState("general");
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedEmergencyType = localStorage.getItem('defaultEmergencyType') || 'general';
    const savedAnalyticsOptIn = localStorage.getItem('analyticsOptIn') !== 'false';
    
    setDefaultEmergencyType(savedEmergencyType);
    setAnalyticsOptIn(savedAnalyticsOptIn);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: t('toast.themeUpdated'),
      description: t('toast.themeChanged')
    });
  };

  const handleLanguageChange = (newLanguage: 'en' | 'ar' | 'fr') => {
    setLanguage(newLanguage);
    toast({
      title: t('toast.languageUpdated'),
      description: t('toast.languageChanged')
    });
  };

  const handleEmergencyTypeChange = (type: string) => {
    setDefaultEmergencyType(type);
    localStorage.setItem('defaultEmergencyType', type);
    toast({
      title: t('toast.emergencyTypeUpdated'),
      description: t('toast.preferenceSaved')
    });
  };

  const handleAnalyticsToggle = (enabled: boolean) => {
    setAnalyticsOptIn(enabled);
    localStorage.setItem('analyticsOptIn', enabled.toString());
    toast({
      title: enabled ? t('toast.analyticsEnabled') : t('toast.analyticsDisabled'),
      description: enabled 
        ? t('toast.analyticsEnabledDesc')
        : t('toast.analyticsDisabledDesc')
    });
  };

  const clearCache = () => {
    // Clear specific cached data while preserving user preferences
    const keysToKeep = ['onboardingDone', 'preferredLanguage', 'defaultEmergencyType', 'analyticsOptIn'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    clearPageMemory();
    
    toast({
      title: t('toast.cacheCleared'),
      description: t('toast.cacheClearedDesc')
    });
  };

  const exportData = () => {
    const data = {
      preferences: {
        language,
        defaultEmergencyType,
        analyticsOptIn
      },
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quicker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t('toast.dataExported'),
      description: t('toast.dataExportedDesc')
    });
  };

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 space-y-8 max-w-2xl ${language === 'ar' ? 'rtl' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center">
            <SettingsIcon className="w-8 h-8 mr-3" />
            {t('settings.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Appearance Settings */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 mr-3" />
            <h2 className="text-xl font-semibold">{t('settings.appearance')}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">{t('settings.theme')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.themeDesc')}
              </p>
            </div>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('settings.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                <SelectItem value="system">{t('settings.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Language Settings */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 mr-3" />
            <h2 className="text-xl font-semibold">{t('settings.language')}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">{t('settings.interfaceLanguage')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.languageDesc')}
              </p>
            </div>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Emergency Preferences */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 mr-3" />
            <h2 className="text-xl font-semibold">{t('settings.emergencyPrefs')}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">{t('settings.defaultEmergencyType')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.emergencyTypeDesc')}
              </p>
            </div>
            <Select value={defaultEmergencyType} onValueChange={handleEmergencyTypeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t('emergency.general')}</SelectItem>
                <SelectItem value="cardiac">{t('emergency.cardiac')}</SelectItem>
                <SelectItem value="pediatric">{t('emergency.pediatric')}</SelectItem>
                <SelectItem value="maternity">{t('emergency.maternity')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Privacy & Data */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Database className="w-5 h-5 mr-3" />
            <h2 className="text-xl font-semibold">{t('settings.privacyData')}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('settings.analytics')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.analyticsDesc')}
                </p>
              </div>
              <Switch
                checked={analyticsOptIn}
                onCheckedChange={handleAnalyticsToggle}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('settings.clearCache')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.cacheDesc')}
                </p>
              </div>
              <Button variant="outline" onClick={clearCache}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('btn.clearCache')}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('settings.exportData')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.exportDesc')}
                </p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                {t('btn.exportData')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Legal & Privacy */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 mr-3" />
            <h2 className="text-xl font-semibold">{t('settings.legal')}</h2>
          </div>
          
          <div className="space-y-4">
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link to="/about">
                {t('settings.aboutApp')}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link to="/privacy-policy">
                {t('settings.privacyPolicy')}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link to="/terms-of-service">
                {t('settings.termsOfService')}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-6 text-center bg-muted/50">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>QuickER</strong> {t('settings.version')}</p>
            <p>{t('settings.tagline')}</p>
            <p className="text-xs">
              {t('settings.copyright')}
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
