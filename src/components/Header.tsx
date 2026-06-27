import { Link } from "@tanstack/react-router";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { useDB } from "@/lib/store";

export function Header() {
  const [open, setOpen] = useState(false);
  const db = useDB();
  const isResident = Boolean(db.authSessions?.residentUserId);
  const isArtisan = Boolean(db.authSessions?.artisanUserId);
  const isAdmin = Boolean(db.authSessions?.adminUserId);

  const links = isAdmin
    ? [
        { to: "/admin-console", label: "Admin Console" },
        { to: "/architecture", label: "Architecture" },
        { to: "/api-contracts", label: "API" },
      ]
    : isArtisan
    ? [
        { to: "/artisan", label: "Artisan Workspace" },
      ]
    : isResident
      ? [
          { to: "/resident", label: "Resident" },
          { to: "/dashboard", label: "Find Artisans" },
        ]
      : [
          { to: "/resident-account", label: "Get Started" },
          { to: "/dashboard", label: "Find Artisans" },
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold leading-none tracking-tight">CityTrust</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Redemption City</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to as any} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-2 bg-muted font-medium text-foreground" }}>{l.label}</Link>
          ))}
        </nav>
        <button onClick={() => setOpen((v) => !v)} className="md:hidden grid h-9 w-9 place-items-center rounded-md border border-border bg-card" aria-label="Toggle menu">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to as any} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">{l.label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
