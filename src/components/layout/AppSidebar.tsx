import { LayoutDashboard, Briefcase, Star, Bot, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: Briefcase },
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "AI Analyst", url: "/ai", icon: Bot },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-[#e2e5ea] bg-white fixed inset-y-0 left-0 z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-[#e2e5ea]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2563eb] rounded-sm flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-semibold text-[#0f172a] text-[15px] tracking-tight">
            CryptoLens-AI
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#64748b] rounded-lg transition-colors hover:bg-[#f1f3f6] hover:text-[#0f172a]"
            activeClassName="bg-[#eff6ff] text-[#2563eb] font-semibold"
          >
            <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
