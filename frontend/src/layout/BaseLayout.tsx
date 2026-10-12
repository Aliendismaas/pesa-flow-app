import { Outlet } from "react-router-dom";
import { useTheme } from "@/context/theme-provider";
import { SunIcon, MoonStarIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const BaseLayout = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-50/70 dark:bg-background relative overflow-x-hidden px-4 py-2 sm:py-3 transition-colors">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating Top Theme Switcher */}
      <div className="absolute top-3 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-foreground rounded-full border border-slate-200/60 dark:border-slate-800 bg-background/60 backdrop-blur-xs shadow-xs"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          {theme === "dark" ? (
            <SunIcon className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <MoonStarIcon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </Button>
      </div>

      {/* Center Auth Outlet - perfectly fitted & vertically centered */}
      <div className="w-full max-w-[420px] sm:max-w-[440px] mx-auto relative z-10 flex-1 flex flex-col justify-center items-center my-auto py-2">
        <Outlet />
      </div>

      {/* Compact 1-line Footer */}
      <footer className="w-full max-w-md py-1 text-center relative z-10 shrink-0">
        <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>PesaFlow • Bank-Grade 256-bit Secure Encryption</span>
        </p>
      </footer>
    </div>
  );
};

export default BaseLayout;
