"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Clock,
  FileText,
  Home,
  Plus,
  Tag,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import type { UserRole } from "@/types/database";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  home: Home,
  "file-text": FileText,
  plus: Plus,
  building: Building2,
  tag: Tag,
  users: Users,
  clock: Clock,
  user: User,
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const basePath = item.href.split("?")[0];
        const active = pathname === basePath || (basePath !== "/" && pathname.startsWith(basePath));
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
