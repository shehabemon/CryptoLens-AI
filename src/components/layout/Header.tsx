import { Search, X, LogOut, User, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { useAssetDetailStore } from "@/store/assetDetailStore";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function Header() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: assets } = useMarketData();
  const openAssetDetail = useAssetDetailStore((s) => s.openAssetDetail);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = lastUpdated.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const results = useMemo(() => {
    if (!assets || query.trim().length === 0) return [];
    const q = query.toLowerCase();
    return assets
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.symbol.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [assets, query]);

  const showDropdown = isFocused && query.trim().length > 0;

  function selectAsset(index: number) {
    const asset = results[index];
    if (asset) {
      openAssetDetail(asset);
      setQuery("");
      setIsFocused(false);
      inputRef.current?.blur();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < results.length) {
        selectAsset(highlightIndex);
      } else if (results.length > 0) {
        selectAsset(0);
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    setHighlightIndex(-1);
  }, [results]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeDescendant =
    highlightIndex >= 0 && results[highlightIndex]
      ? `search-result-${results[highlightIndex].id}`
      : undefined;

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-14 border-b border-[#e2e5ea] bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-[#2563eb] rounded-sm flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <span className="font-semibold text-[#0f172a] text-[15px] tracking-tight">
          CryptoLens-AI
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto relative" role="combobox" aria-expanded={showDropdown} aria-haspopup="listbox" aria-owns="search-results-listbox">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" aria-hidden="true" />
          <Input
            ref={inputRef}
            placeholder="Search assets..."
            className="pl-10 pr-8 bg-[#f1f3f6] border-transparent h-9 text-sm rounded-lg focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            id="header-search-input"
            aria-label="Search assets"
            aria-autocomplete="list"
            aria-controls={showDropdown ? "search-results-listbox" : undefined}
            aria-activedescendant={activeDescendant}
            role="searchbox"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-[#0f172a] transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            id="search-results-listbox"
            role="listbox"
            aria-label="Search results"
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#e2e5ea] rounded-xl overflow-hidden z-50 shadow-dropdown"
          >
            {results.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-[#94a3b8]" role="status">
                No results for "{query}"
              </div>
            ) : (
              <div className="py-1">
                {results.map((asset, i) => {
                  const positive = asset.changePercent24h >= 0;
                  return (
                    <button
                      key={asset.id}
                      id={`search-result-${asset.id}`}
                      role="option"
                      aria-selected={i === highlightIndex}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors ${i === highlightIndex
                        ? "bg-[#f1f3f6]"
                        : "hover:bg-[#f1f3f6]"
                        }`}
                      onClick={() => selectAsset(i)}
                      onMouseEnter={() => setHighlightIndex(i)}
                    >
                      {asset.image && (
                        <img
                          src={asset.image}
                          alt=""
                          aria-hidden="true"
                          className="w-6 h-6 rounded-full shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-[#0f172a]">
                          {asset.name}
                        </p>
                        <p className="text-xs text-[#94a3b8] font-mono">
                          {asset.symbol}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-medium text-[#0f172a]">
                          {formatCurrency(asset.price)}
                        </p>
                        <p
                          className={`text-xs font-mono ${positive ? "text-[#16a34a]" : "text-[#dc2626]"
                            }`}
                        >
                          {positive ? "+" : ""}
                          {asset.changePercent24h?.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-[#94a3b8] font-mono shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" aria-hidden="true" />
        <span aria-live="off">LIVE {timeStr}</span>
      </div>

      {/* User menu */}
      {user && (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f1f3f6] transition-colors"
            aria-label="User menu"
            aria-expanded={showUserMenu}
            id="user-menu-btn"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">
              {userInitial}
            </div>
            <span className="hidden md:block text-sm font-medium text-[#0f172a] max-w-[120px] truncate">
              {user.name || user.email.split("@")[0]}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#e2e5ea] rounded-xl shadow-dropdown overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#e2e5ea]">
                <p className="text-sm font-medium text-[#0f172a] truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-[#94a3b8] truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                  id="logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
