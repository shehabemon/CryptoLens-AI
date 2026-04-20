import { LayoutDashboard, Briefcase, Star, Bot } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const tabs = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: Briefcase },
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "AI Analyst", url: "/ai", icon: Bot },
];

export function MobileTabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#e2e5ea] flex"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.url}
          to={tab.url}
          end={tab.url === "/"}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[#94a3b8] transition-colors"
          activeClassName="text-[#2563eb]"
        >
          <tab.icon className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="text-[10px] font-medium">{tab.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
