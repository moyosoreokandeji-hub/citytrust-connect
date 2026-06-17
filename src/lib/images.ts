// Visual assets for CityTrust. Core service and hero images are local so the demo does not depend on external image loading.

const local = (name: string) => `/images/uploads/${name}`;
const remote = (id: string, w = 1200, h = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const CATEGORY_IMAGES: Record<string, string> = {
  c1: local("service-plumbing.png"),
  c2: local("service-electrical.png"),
  c3: local("service-cleaning.png"),
  c4: local("service-carpentry.png"),
  c5: local("service-ac-repair.png"),
  c6: local("service-mechanic.png"),
  c7: local("service-maintenance.png"),
};

export function categoryImage(id?: string) {
  return (id && CATEGORY_IMAGES[id]) || CATEGORY_IMAGES.c7;
}

export const PORTFOLIO_IMAGES: Record<string, string[]> = {
  c1: [CATEGORY_IMAGES.c1, local("hero-plumbing.png"), CATEGORY_IMAGES.c7],
  c2: [CATEGORY_IMAGES.c2, local("hero-main-electrician.jpg"), CATEGORY_IMAGES.c7],
  c3: [CATEGORY_IMAGES.c3, local("hero-cleaning.png"), CATEGORY_IMAGES.c7],
  c4: [CATEGORY_IMAGES.c4, CATEGORY_IMAGES.c7, local("hero-main-electrician.jpg")],
  c5: [CATEGORY_IMAGES.c5, local("hero-ac-repair.png"), CATEGORY_IMAGES.c7],
  c6: [CATEGORY_IMAGES.c6, CATEGORY_IMAGES.c7, local("hero-main-electrician.jpg")],
  c7: [CATEGORY_IMAGES.c7, local("hero-main-electrician.jpg"), CATEGORY_IMAGES.c2],
};

export function portfolioImages(catId?: string) {
  return (catId && PORTFOLIO_IMAGES[catId]) || PORTFOLIO_IMAGES.c7;
}

const AVATARS: Record<string, string> = {
  a0: remote("photo-1500648767791-00dcc994a43e", 600, 600),
  a1: remote("photo-1472099645785-5658abf4ff4e", 600, 600),
  a2: remote("photo-1494790108377-be9c29b29330", 600, 600),
  a3: remote("photo-1507003211169-0a1dd7228f2d", 600, 600),
  a4: remote("photo-1544005313-94ddf0286df2", 600, 600),
  a5: remote("photo-1560250097-0b93528c311a", 600, 600),
  a6: remote("photo-1531123897727-8f129e1688ce", 600, 600),
  a7: remote("photo-1527980965255-d3b416303d12", 600, 600),
  a8: remote("photo-1547425260-76bcadfb4f2c", 600, 600),
  "hero-1": remote("photo-1500648767791-00dcc994a43e", 600, 600),
};

export function artisanAvatar(seed: string) {
  return AVATARS[seed] || remote("photo-1500648767791-00dcc994a43e", 600, 600);
}

export const HERO_IMAGES = [
  local("hero-main-electrician.jpg"),
  local("hero-cleaning.png"),
  local("hero-plumbing.png"),
  local("hero-ac-repair.png"),
];

export const RESIDENT_DASHBOARD_BG = local("hero-main-electrician.jpg");
