import React from 'react';
import { ArrowLeft, Shield, Database, MapPin, Users, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';

const PrivacyPolicy = () => {
  const { t, language } = useLanguage();

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 max-w-4xl ${language === 'ar' ? 'rtl' : ''}`}>
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-2">
            <Link to="/settings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('privacy.backToSettings')}
            </Link>
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 mr-3 text-primary" />
              <h1 className="text-3xl font-bold">{t('privacy.title')}</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-2">
              {t('privacy.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('privacy.lastUpdated')}
            </p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            {t('privacy.introduction.title')}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('privacy.introduction.desc1')}
          </p>
          <p className="text-muted-foreground">
            {t('privacy.introduction.desc2')}
          </p>
        </Card>

        {/* Information We Collect */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            {t('privacy.dataCollection.title')}
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{t('privacy.dataCollection.location.title')}</h3>
              <p className="text-muted-foreground mb-2">{t('privacy.dataCollection.location.desc')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>{t('privacy.dataCollection.location.item1')}</li>
                <li>{t('privacy.dataCollection.location.item2')}</li>
                <li>{t('privacy.dataCollection.location.item3')}</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">{t('privacy.dataCollection.usage.title')}</h3>
              <p className="text-muted-foreground mb-2">{t('privacy.dataCollection.usage.desc')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>{t('privacy.dataCollection.usage.item1')}</li>
                <li>{t('privacy.dataCollection.usage.item2')}</li>
                <li>{t('privacy.dataCollection.usage.item3')}</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">{t('privacy.dataCollection.preferences.title')}</h3>
              <p className="text-muted-foreground mb-2">{t('privacy.dataCollection.preferences.desc')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>{t('privacy.dataCollection.preferences.item1')}</li>
                <li>{t('privacy.dataCollection.preferences.item2')}</li>
                <li>{t('privacy.dataCollection.preferences.item3')}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* How We Use Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            {t('privacy.dataUse.title')}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-muted-foreground">{t('privacy.dataUse.item1')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-muted-foreground">{t('privacy.dataUse.item2')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-muted-foreground">{t('privacy.dataUse.item3')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-muted-foreground">{t('privacy.dataUse.item4')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-muted-foreground">{t('privacy.dataUse.item5')}</p>
            </div>
          </div>
        </Card>

        {/* Location Data */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {t('privacy.location.title')}
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{t('privacy.location.important.title')}</h3>
              <p className="text-blue-800 text-sm">{t('privacy.location.important.desc')}</p>
            </div>
            
            <p className="text-muted-foreground">{t('privacy.location.desc1')}</p>
            <p className="text-muted-foreground">{t('privacy.location.desc2')}</p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{t('privacy.location.controls.title')}</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>{t('privacy.location.controls.item1')}</li>
                <li>{t('privacy.location.controls.item2')}</li>
                <li>{t('privacy.location.controls.item3')}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Data Sharing */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('privacy.sharing.title')}</h2>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">{t('privacy.sharing.desc')}</p>
            
            <div>
              <h3 className="font-semibold mb-2">{t('privacy.sharing.thirdParty.title')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>{t('privacy.sharing.thirdParty.item1')}</li>
                <li>{t('privacy.sharing.thirdParty.item2')}</li>
                <li>{t('privacy.sharing.thirdParty.item3')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('privacy.sharing.emergency.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('privacy.sharing.emergency.desc')}</p>
            </div>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            {t('privacy.rights.title')}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium">{t('privacy.rights.access.title')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.rights.access.desc')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium">{t('privacy.rights.export.title')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.rights.export.desc')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium">{t('privacy.rights.delete.title')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.rights.delete.desc')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium">{t('privacy.rights.analytics.title')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.rights.analytics.desc')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('privacy.security.title')}</h2>
          <p className="text-muted-foreground mb-4">{t('privacy.security.desc')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{t('privacy.security.encryption.title')}</h4>
              <p className="text-sm text-muted-foreground">{t('privacy.security.encryption.desc')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{t('privacy.security.storage.title')}</h4>
              <p className="text-sm text-muted-foreground">{t('privacy.security.storage.desc')}</p>
            </div>
          </div>
        </Card>

        {/* Updates */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('privacy.updates.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.updates.desc')}</p>
        </Card>

        {/* Contact */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('privacy.contact.title')}</h2>
          <p className="text-muted-foreground mb-4">{t('privacy.contact.desc')}</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm"><strong>{t('privacy.contact.address')}</strong> {t('privacy.contact.addressLine')}</p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('privacy.footer')}</p>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;