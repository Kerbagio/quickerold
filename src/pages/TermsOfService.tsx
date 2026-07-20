import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsOfService = () => {
  const { language } = useLanguage();

  return (
    <Layout>
      <main
        className={`container mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <Button variant="ghost" asChild>
          <Link to="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
          </Link>
        </Button>

        <div className="text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="mb-3 text-4xl font-bold">Prototype Terms of Use</h1>
          <p className="text-muted-foreground">Last updated: July 2026</p>
        </div>

        <Card className="p-7">
          <h2 className="mb-3 text-2xl font-semibold">1. Hackathon prototype</h2>
          <p className="leading-relaxed text-muted-foreground">
            QuickER is an experimental emergency-access routing project. By using it, you understand that its results are informational, may be incomplete, and are not a guaranteed dispatch or clinical service.
          </p>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5 p-7">
          <div className="mb-3 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <h2 className="text-2xl font-semibold">2. Emergency safety</h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            QuickER does not diagnose, recommend treatment, dispatch ambulances, or confirm that a facility can provide a required service. In an urgent situation, contact local emergency services and do not delay care to use this app.
          </p>
        </Card>

        <Card className="p-7">
          <h2 className="mb-3 text-2xl font-semibold">3. Data limitations</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Hospital locations and specialty tags may be missing, stale, or incorrect.</li>
            <li>ETAs depend on third-party routing providers and current network access.</li>
            <li>Availability statuses are simulated unless an authorized operational feed is explicitly connected.</li>
            <li>Always confirm specialty, opening status, and current capability with the facility.</li>
          </ul>
        </Card>

        <Card className="p-7">
          <h2 className="mb-3 text-2xl font-semibold">4. Free-service availability</h2>
          <p className="leading-relaxed text-muted-foreground">
            QuickER uses free quotas and public best-effort services. They can be slow, unavailable, or rate-limited. The app attempts a clearly labelled fallback, but continuous operation and accuracy are not guaranteed.
          </p>
        </Card>

        <Card className="p-7">
          <h2 className="mb-3 text-2xl font-semibold">5. Responsible use</h2>
          <p className="leading-relaxed text-muted-foreground">
            Do not misuse QuickER to overload providers, represent simulated information as real hospital data, or make unsupported clinical or dispatch claims. This prototype is provided as-is to the extent permitted by applicable law.
          </p>
        </Card>

        <Card className="p-7">
          <h2 className="mb-3 text-2xl font-semibold">6. Privacy and contact</h2>
          <p className="leading-relaxed text-muted-foreground">
            Read the <Link className="text-primary underline" to="/privacy-policy">Privacy Policy</Link> for the exact browser storage and provider data flow. Project details and contact routes are available on the <Link className="text-primary underline" to="/about">About page</Link> and public repository.
          </p>
        </Card>
      </main>
    </Layout>
  );
};

export default TermsOfService;
