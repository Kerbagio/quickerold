import { ReactNode } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

const Layout = ({ children, showHeader = true }: LayoutProps) => {
  return (
    <div className="min-h-screen-dvh bg-background">
      {showHeader && <Header />}
      <main className="pb-[calc(6rem+var(--safe-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
