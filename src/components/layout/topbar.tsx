import { Building2, LogOut, Menu } from "lucide-react";

import type { Profile } from "@/types/database";
import { ROL_ETIKETLERI } from "@/lib/constants";
import { signOut } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./sidebar";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-0">
            <Sidebar role={profile.role} />
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2 font-semibold">
          <Building2 className="size-5 text-primary" />
          <span className="hidden sm:inline">Hakediş Takip Sistemi</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm leading-tight font-medium">{profile.full_name || profile.email}</p>
          <p className="text-xs leading-tight text-muted-foreground">
            {ROL_ETIKETLERI[profile.role]}
          </p>
        </div>
        <Avatar>
          <AvatarFallback>{initials(profile.full_name || profile.email)}</AvatarFallback>
        </Avatar>
        <form action={signOut}>
          <Button variant="ghost" size="icon" title="Çıkış Yap">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
