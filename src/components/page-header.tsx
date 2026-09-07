import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  badges: { text: string; color: string; live?: boolean }[];
  title: string;
  description: string;
}

export function PageHeader({ badges, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {badges.map((b) => (
          <Badge
            key={b.text}
            style={{ backgroundColor: b.color, color: "#fff", "--badge-neon-color": `${b.color}99` } as CSSProperties}
            className={`text-[10px] uppercase tracking-wider shrink-0 ${b.live ? "badge-neon" : ""}`}
          >
            {b.live && (
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_#fff]"
              />
            )}
            {b.text}
          </Badge>
        ))}
      </div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight gradient-text break-words">{title}</h1>
      <div className="accent-bar accent-bar-anim mt-2" />
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
