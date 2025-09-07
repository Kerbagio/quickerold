import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsOfService = () => {
  const { language, t } = useLanguage();

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 max-w-4xl ${language === 'ar' ? 'rtl' : ''}`}>
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/settings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('terms.backToSettings')}
            </Link>
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center">
              <FileText className="w-10 h-10 mr-4" />
              {t('terms.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('terms.lastUpdated')} {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.acceptance.title')}</h2>
            <p className="text-foreground leading-relaxed mb-4">
              {t('terms.acceptance.desc1')}
            </p>
            <p className="text-foreground leading-relaxed">
              {t('terms.acceptance.desc2')}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.medical.title')}</h2>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-4">
              <p className="text-destructive font-semibold mb-2">{t('terms.medical.important')}</p>
              <p className="text-foreground leading-relaxed">
                {t('terms.medical.disclaimer')}
              </p>
            </div>
            <p className="text-foreground leading-relaxed">
              {t('terms.medical.desc')}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.license.title')}</h2>
            <p className="text-foreground leading-relaxed mb-4">
              {t('terms.license.desc')}
            </p>
            <ul className="list-disc ml-6 space-y-2 text-foreground">
              <li>{t('terms.license.item1')}</li>
              <li>{t('terms.license.item2')}</li>
              <li>{t('terms.license.item3')}</li>
              <li>{t('terms.license.item4')}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.responsibilities.title')}</h2>
            <p className="text-foreground leading-relaxed mb-4">{t('terms.responsibilities.desc')}</p>
            <ul className="list-disc ml-6 space-y-2 text-foreground">
              <li>{t('terms.responsibilities.item1')}</li>
              <li>{t('terms.responsibilities.item2')}</li>
              <li>{t('terms.responsibilities.item3')}</li>
              <li>{t('terms.responsibilities.item4')}</li>
              <li>{t('terms.responsibilities.item5')}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.privacy.title')}</h2>
            <p className="text-foreground leading-relaxed mb-4">
              {t('terms.privacy.desc')}
            </p>
            <ul className="list-disc ml-6 space-y-2 text-foreground mb-4">
              <li>{t('terms.privacy.item1')}</li>
              <li>{t('terms.privacy.item2')}</li>
              <li>{t('terms.privacy.item3')}</li>
            </ul>
            <p className="text-foreground leading-relaxed">
              {t('terms.privacy.policy')} {' '}
              <Link to="/privacy-policy" className="text-primary hover:underline">{t('settings.privacyPolicy')}</Link>.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.availability.title')}</h2>
            <p className="text-foreground leading-relaxed mb-4">
              {t('terms.availability.desc')}
            </p>
            <ul className="list-disc ml-6 space-y-2 text-foreground">
              <li>{t('terms.availability.item1')}</li>
              <li>{t('terms.availability.item2')}</li>
              <li>{t('terms.availability.item3')}</li>
              <li>{t('terms.availability.item4')}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.liability.title')}</h2>
            <p className="text-foreground leading-relaxed">
              {t('terms.liability.desc')}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.modifications.title')}</h2>
            <p className="text-foreground leading-relaxed">
              {t('terms.modifications.desc')}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.governing.title')}</h2>
            <p className="text-foreground leading-relaxed">
              {t('terms.governing.desc')}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">{t('terms.contact.title')}</h2>
            <p className="text-foreground leading-relaxed mb-4">
              {t('terms.contact.desc')} {' '}
              <Link to="/about" className="text-primary hover:underline">{t('terms.contact.about')}</Link>.
            </p>
            <p className="text-sm text-muted-foreground">
              {t('terms.contact.effective')}
            </p>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link to="/settings">
              {t('terms.returnToSettings')}
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;