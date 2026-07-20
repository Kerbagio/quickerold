import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mb-8">
            <div className="mb-4 text-6xl font-bold text-primary">404</div>
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              Page not found
            </h1>
            <p className="mb-8 text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild>
              <Link to="/home">
                <Home className="h-4 w-4" />
                Return Home
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
