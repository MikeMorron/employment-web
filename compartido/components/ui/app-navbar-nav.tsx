"use client";

import Link from "next/link";

export type NavbarRole = "candidate" | "company" | "admin";

type NavItem = {
  href: string;
  labelEs: string;
  labelEn: string;
  match: (pathname: string) => boolean;
};

type ResolvedNavItem = {
  href: string;
  label: string;
  active: boolean;
};

export const candidateNavItems: NavItem[] = [
  {
    href: "/vacantes",
    labelEs: "Explorar vacantes",
    labelEn: "Explore jobs",
    match: (pathname) => pathname === "/vacantes",
  },
  {
    href: "/matches",
    labelEs: "Coincidencias",
    labelEn: "Matches",
    match: (pathname) => pathname === "/matches",
  },
  {
    href: "/postulaciones",
    labelEs: "Postulaciones",
    labelEn: "Applications",
    match: (pathname) => pathname === "/postulaciones",
  },
  {
    href: "/chat",
    labelEs: "Chat",
    labelEn: "Chat",
    match: (pathname) => pathname === "/chat",
  },
];

export const companyNavItems: NavItem[] = [
  {
    href: "/analytics",
    labelEs: "Dashboard",
    labelEn: "Dashboard",
    match: (pathname) => pathname === "/analytics",
  },
  {
    href: "/vacantes",
    labelEs: "Encontrar talento",
    labelEn: "Find talent",
    match: (pathname) => pathname === "/vacantes",
  },
  {
    href: "/candidatos",
    labelEs: "Candidatos",
    labelEn: "Candidates",
    match: (pathname) => pathname === "/candidatos",
  },
  {
    href: "/publicadas",
    labelEs: "Administrar vacantes",
    labelEn: "Manage jobs",
    match: (pathname) => pathname === "/publicadas",
  },
  {
    href: "/chat",
    labelEs: "Mis chats",
    labelEn: "My chats",
    match: (pathname) => pathname === "/chat",
  },
  {
    href: "/ajustes",
    labelEs: "Ajustes",
    labelEn: "Settings",
    match: (pathname) => pathname === "/ajustes",
  },
];

export const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    labelEs: "Dashboard admin",
    labelEn: "Admin dashboard",
    match: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/usuarios",
    labelEs: "Usuarios",
    labelEn: "Users",
    match: (pathname) => pathname === "/admin/usuarios",
  },
  {
    href: "/admin/vacantes",
    labelEs: "Vacantes",
    labelEn: "Jobs",
    match: (pathname) => pathname === "/admin/vacantes",
  },
];

export function renderAppNavbarLabel(
  href: string,
  role: NavbarRole,
  t: (key: string) => string,
) {
  if (role === "company" && href === "/vacantes") {
    return t("findTalent");
  }

  if (role === "admin" && href === "/admin") {
    return "Dashboard admin";
  }

  if (role === "admin" && href === "/admin/usuarios") {
    return "Usuarios";
  }

  if (role === "admin" && href === "/admin/vacantes") {
    return "Vacantes";
  }

  if (href === "/candidatos") {
    return t("candidates");
  }

  if (href === "/publicadas") {
    return role === "company" ? (t("manageJobs") || "Administrar vacantes") : t("publishedJobs");
  }

  if (href === "/analytics") {
    return role === "company" ? "Dashboard" : t("analytics");
  }

  if (href === "/vacantes") {
    return t("exploreJobs");
  }

  if (href === "/matches") {
    return t("matches");
  }

  if (href === "/postulaciones") {
    return t("applications");
  }

  if (href === "/chat") {
    return role === "company" ? (t("myChats") || "Mis chats") : t("chat");
  }

  return t("myProfile");
}

function NavLinks({
  isDark,
  items,
  mobile,
}: {
  isDark: boolean;
  items: ResolvedNavItem[];
  mobile?: boolean;
}) {
  return items.map((item) => (
    <Link
      key={`${mobile ? "mobile" : "desktop"}-${item.href}`}
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={
        item.active
          ? isDark
            ? `ts-nav-item ${mobile ? "whitespace-nowrap " : ""}rounded-[0.95rem] bg-white/10 px-3.5 py-2 text-sm font-medium text-white`
            : `ts-nav-item ${mobile ? "whitespace-nowrap " : ""}rounded-[0.95rem] bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-950`
          : isDark
            ? `ts-nav-item ${mobile ? "whitespace-nowrap " : ""}rounded-[0.95rem] px-3.5 py-2 text-sm font-medium text-slate-300${mobile ? "" : " transition hover:bg-white/6 hover:text-white"}`
            : `ts-nav-item ${mobile ? "whitespace-nowrap " : ""}rounded-[0.95rem] px-3.5 py-2 text-sm font-medium text-slate-600${mobile ? "" : " transition hover:bg-slate-100 hover:text-slate-950"}`
      }
    >
      {item.label}
    </Link>
  ));
}

export function AppNavbarNav({
  isDark,
  items,
}: {
  isDark: boolean;
  items: ResolvedNavItem[];
}) {
  return (
    <>
      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex">
        <NavLinks isDark={isDark} items={items} />
      </nav>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavLinks isDark={isDark} items={items} mobile />
      </div>
    </>
  );
}
