import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileTabBar } from "./MobileTabBar";
import { AssetDetailPanel } from "@/components/dashboard/AssetDetailPanel";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f8f9fb] overflow-x-hidden">
      <AppSidebar />
      <div className="flex-1 min-w-0 md:ml-56 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileTabBar />
      <AssetDetailPanel />
    </div>
  );
}
