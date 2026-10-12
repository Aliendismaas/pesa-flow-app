import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthContext } from "@/context/auth-provider";
import { useTheme } from "@/context/theme-provider";
import { usePrivacy } from "@/context/privacy-provider";
import { Eye, EyeOff, MoonStarIcon, SunIcon } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  const { user } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <header className="sticky top-0 z-30 shrink-0 w-full bg-background/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex h-[60px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 text-slate-600 dark:text-slate-300 hover:text-foreground" />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Global Persistent Privacy Mode Toggle */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-semibold transition-all border ${
              isPrivacyMode
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-100"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
            }`}
            title={isPrivacyMode ? "Privacy Mode is ON (Amounts Hidden). Click to show." : "Privacy Mode is OFF (Amounts Visible). Click to hide."}
          >
            {isPrivacyMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Hidden</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visible</span>
              </>
            )}
          </button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <SunIcon className="w-4 h-4 text-amber-400" />
            ) : (
              <MoonStarIcon className="w-4 h-4 text-slate-700" />
            )}
          </Button>

          {/* User profile */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-xs font-semibold hidden md:inline text-slate-800 dark:text-slate-200">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
