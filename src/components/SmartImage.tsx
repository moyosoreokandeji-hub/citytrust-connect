import { useState } from "react";
import {
  Droplets, Zap, Hammer, Wind, Wrench, Settings,
  Image as ImageIcon, type LucideIcon,
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; Icon: LucideIcon }> = {
  c1: { label: "Plumbing Service", Icon: Droplets },
  c2: { label: "Electrical Work", Icon: Zap },
  c3: { label: "Cleaning Service", Icon: Wrench },
  c4: { label: "Carpentry", Icon: Hammer },
  c5: { label: "AC Repair", Icon: Wind },
  c6: { label: "Mechanic Service", Icon: Wrench },
  c7: { label: "General Maintenance", Icon: Settings },
};

function initialsFrom(name?: string) {
  if (!name) return "CT";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "CT";
}

interface Props {
  src?: string;
  alt: string;
  className?: string;
  categoryId?: string;
  fallbackLabel?: string;
  variant?: "photo" | "avatar";
  loading?: "lazy" | "eager";
}

export function SmartImage({ src, alt, className = "", categoryId, fallbackLabel, variant = "photo", loading = "lazy" }: Props) {
  const [failed, setFailed] = useState(!src);

  if (!failed && src) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  if (variant === "avatar") {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-[linear-gradient(135deg,oklch(0.72_0.12_200),oklch(0.55_0.15_230))] text-white font-semibold ${className}`}
      >
        <span className="text-sm">{initialsFrom(alt)}</span>
      </div>
    );
  }

  const meta = (categoryId && CATEGORY_META[categoryId]) || undefined;
  const Icon = meta?.Icon ?? ImageIcon;
  const label = fallbackLabel ?? meta?.label ?? "CityTrust Service";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`ct-service-visual flex flex-col items-center justify-center gap-3 text-primary-foreground ${className}`}
    >
      <div className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-white/22 text-white shadow-lg backdrop-blur-md ring-1 ring-white/30">
        <Icon className="h-6 w-6" />
      </div>
      <div className="relative z-10 max-w-[85%] rounded-full bg-black/12 px-3 py-1 text-center text-xs font-bold tracking-wide text-white shadow-sm backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
}
