import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, MapPin, TrendingUp, Download } from "lucide-react";
import Layout from "@/components/Layout";
import Map from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { t, language } = useLanguage();
  
  // Mock analytics data
  const kpiData = {
    citywideAverage: "12 " + t('dashboard.minutes'),
    peakHour: "5:00 PM",
    bestHour: "3:00 AM"
  };

  const slowestAreas = [
    { area: "Downtown Core", avgEta: "18 " + t('dashboard.minutes'), change: "+2 " + t('dashboard.minutes') },
    { area: "West End", avgEta: "16 " + t('dashboard.minutes'), change: "+1 " + t('dashboard.minutes') },
    { area: "Suburbs North", avgEta: "15 " + t('dashboard.minutes'), change: "±0 " + t('dashboard.minutes') },
    { area: "East District", avgEta: "14 " + t('dashboard.minutes'), change: "-1 " + t('dashboard.minutes') },
    { area: "South Bay", avgEta: "13 " + t('dashboard.minutes'), change: "-2 " + t('dashboard.minutes') },
  ];

  const generateSampleData = () => {
    console.log("Generating sample data for dashboard");
    // This would populate the dashboard with demo data
  };

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 space-y-8 ${language === 'ar' ? 'rtl' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('dashboard.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              {kpiData.citywideAverage}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('dashboard.avgETA')}
            </div>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-xl mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive mb-2">
              {kpiData.peakHour}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('dashboard.peakHour')}
            </div>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-xl mx-auto mb-4">
              <MapPin className="w-6 h-6 text-success" />
            </div>
            <div className="text-3xl font-bold text-success mb-2">
              {kpiData.bestHour}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('dashboard.bestHour')}
            </div>
          </Card>
        </div>

        {/* Chart Placeholder */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {t('dashboard.avgETAByHour')} {t('dashboard.hour')}
            </h2>
            <Badge variant="outline">{t('dashboard.last7Days')}</Badge>
          </div>
          <div className="h-64 bg-muted/30 rounded-xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t('dashboard.noData')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={generateSampleData}
              >
                {t('dashboard.generateSample')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Heat Map */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {t('dashboard.neighborhoodTimes')}
          </h2>
          <Map className="h-80" />
        </Card>

        {/* Slowest Areas Table */}
        <Card className="p-6">
          <div className={`flex items-center justify-between mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-semibold">
              {t('dashboard.longestTimes')}
            </h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('dashboard.exportData')}
            </Button>
          </div>
          <div className="space-y-4">
            {slowestAreas.map((area, index) => (
              <div 
                key={area.area}
                className={`flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-semibold mr-4">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{area.area}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('dashboard.avgTime')}
                    </div>
                  </div>
                </div>
                <div className={`text-right ${language === 'ar' ? 'text-left' : ''}`}>
                  <div className="text-lg font-bold">{area.avgEta}</div>
                  <Badge 
                    variant="outline" 
                    className={
                      area.change.startsWith('+') ? 'text-destructive' :
                      area.change.startsWith('-') ? 'text-success' :
                      'text-muted-foreground'
                    }
                  >
                    {area.change}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;