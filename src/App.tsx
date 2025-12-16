import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
];

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return "light";
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">TaylorDB Starter</span>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                      isActive && "bg-accent text-foreground"
                    )
                  }
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              onClick={() =>
                setTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" asChild>
              <a href="https://ui.shadcn.com/" target="_blank" rel="noreferrer">
                shadcn/ui
              </a>
            </Button>
            <Button asChild>
              <a
                href="https://reactrouter.com/6.30.2"
                target="_blank"
                rel="noreferrer"
              >
                React Router V6
              </a>
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
