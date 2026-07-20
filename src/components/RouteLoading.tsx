import { useLocation } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import Layout from "@/components/Layout";
import LoadingState from "@/components/LoadingState";

const RouteLoading = () => {
  const { pathname } = useLocation();
  const isFocusedFlow =
    pathname === "/" ||
    pathname === "/get-started" ||
    pathname === "/onboarding";

  if (isFocusedFlow) {
    return (
      <div className="flex min-h-screen-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <BrandLogo className="mx-auto h-11" />
          <LoadingState
            className="mt-8 text-left"
            title="Loading QuickER"
            description="Preparing the free hospital-routing experience…"
            rows={2}
          />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <LoadingState
          title="Loading this page"
          description="Restoring your saved page data and controls…"
        />
      </div>
    </Layout>
  );
};

export default RouteLoading;
