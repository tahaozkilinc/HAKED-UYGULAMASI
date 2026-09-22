"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { muhendisKarar } from "@/app/(app)/hakedisler/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Karar = "onayla" | "revizyon" | "sil";

function KararForm({
  id,
  karar,
  onDone,
  notRequired,
  submitLabel,
  submitVariant,
}: {
  id: string;
  karar: Karar;
  onDone: () => void;
  notRequired: boolean;
  submitLabel: string;
  submitVariant: "default" | "destructive" | "warning";
}) {
  const [state, formAction, pending] = useActionState(muhendisKarar, undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("İşlem kaydedildi.");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="karar" value={karar} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`not-${karar}`}>
          Not {notRequired ? <span className="text-destructive">*</span> : "(opsiyonel)"}
        </Label>
        <Textarea id={`not-${karar}`} name="not" required={notRequired} placeholder="Açıklama yazın…" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={pending} variant={submitVariant === "default" ? "default" : submitVariant === "destructive" ? "destructive" : "outline"}>
          {pending ? "Gönderiliyor…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function MuhendisKararPanel({ id }: { id: string }) {
  const [onaylaOpen, setOnaylaOpen] = useState(false);
  const [revizyonOpen, setRevizyonOpen] = useState(false);
  const [silOpen, setSilOpen] = useState(false);
  const [onaylaState, onaylaAction, onaylaPending] = useActionState(muhendisKarar, undefined);

  useEffect(() => {
    if (onaylaState?.success) {
      toast.success("Hakediş onaylandı.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sunucu aksiyonu tamamlandığında dialog'u kapatır, döngü riski yok
      setOnaylaOpen(false);
    }
  }, [onaylaState]);

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog open={onaylaOpen} onOpenChange={setOnaylaOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="success">
            <CheckCircle2 className="size-4" /> Onayla
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hakedişi onaylıyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Onayladıktan sonra süreç kapanır ve hakediş salt okunur hale gelir. Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={onaylaAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="karar" value="onayla" />
            {onaylaState?.error && <p className="mb-2 text-sm text-destructive">{onaylaState.error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Vazgeç</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={onaylaPending}>
                {onaylaPending ? "Onaylanıyor…" : "Evet, Onayla"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={revizyonOpen} onOpenChange={setRevizyonOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Undo2 className="size-4" /> Revizyon İste
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revizyon Talebi</DialogTitle>
            <DialogDescription>
              Firma bu notu görecek ve hakedişi düzenleyip yeniden gönderecektir.
            </DialogDescription>
          </DialogHeader>
          <KararForm
            id={id}
            karar="revizyon"
            notRequired
            submitLabel="Revizyon İste"
            submitVariant="warning"
            onDone={() => setRevizyonOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={silOpen} onOpenChange={setSilOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" /> Sil
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hakedişi Sil</DialogTitle>
            <DialogDescription>
              Hakediş sistemde &quot;silindi&quot; olarak işaretlenir, kayıt geçmişten kaybolmaz.
            </DialogDescription>
          </DialogHeader>
          <KararForm
            id={id}
            karar="sil"
            notRequired={false}
            submitLabel="Sil"
            submitVariant="destructive"
            onDone={() => setSilOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
