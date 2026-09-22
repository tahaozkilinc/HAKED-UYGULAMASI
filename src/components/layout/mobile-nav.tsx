"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";

import type { UserRole } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function MobileNav({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Image src="/sunar-logo.png" alt="Sunar" width={80} height={37} className="h-5 w-auto" />
            Hakediş Takip
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto">
          <Sidebar role={role} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
