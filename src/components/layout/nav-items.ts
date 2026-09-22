import type { UserRole } from "@/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "file-text" | "plus" | "building" | "tag" | "users" | "clock" | "user";
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Panel", icon: "home", roles: ["admin", "firma", "muhendis", "satin_alma"] },
  { href: "/hakedisler/yeni", label: "Yeni Hakediş", icon: "plus", roles: ["firma"] },
  { href: "/hakedisler?durum=incelemede", label: "Onay Bekleyenler", icon: "clock", roles: ["muhendis"] },
  { href: "/hakedisler", label: "Hakedişlerim", icon: "file-text", roles: ["firma"] },
  { href: "/hakedisler", label: "Tüm Hakedişler", icon: "file-text", roles: ["muhendis", "satin_alma", "admin"] },
  { href: "/admin/firmalar", label: "Firmalar", icon: "building", roles: ["admin"] },
  { href: "/admin/etiketler", label: "Etiketler", icon: "tag", roles: ["admin"] },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: "users", roles: ["admin"] },
  { href: "/profil", label: "Profilim", icon: "user", roles: ["admin", "firma", "muhendis", "satin_alma"] },
];
