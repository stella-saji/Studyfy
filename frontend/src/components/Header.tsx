import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyfyData } from "@/types/studyfy";

interface HeaderProps {
  data: StudyfyData;
}

export function Header({ data }: HeaderProps) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const saved = localStorage.getItem("studyfy_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("studyfy_theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-ink px-6">
      <h1 className="text-xl font-bold tracking-tight text-primary-foreground font-display">
        Studyfy<span className="text-burnt-orange">.</span>
      </h1>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground">
          {data.materials.length} files
        </span>
        <span className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground">
          {data.subjects.length} subjects
        </span>
        <Button size="icon" variant="ghost" onClick={toggle} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
