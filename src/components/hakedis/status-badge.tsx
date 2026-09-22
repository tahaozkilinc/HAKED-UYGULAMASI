import { AlertTriangle } from "lucide-react";

import type { HakedisStatus } from "@/types/database";
import { DURUM_ETIKETLERI, DURUM_RENKLERI } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: HakedisStatus }) {
  return <Badge variant={DURUM_RENKLERI[status]}>{DURUM_ETIKETLERI[status]}</Badge>;
}

export function RevizyonUyarisi({ sayi }: { sayi: number }) {
  if (!sayi) return null;
  return (
    <Badge variant="warning" className="gap-1">
      <AlertTriangle className="size-3" />
      {sayi} kez revize edildi
    </Badge>
  );
}
