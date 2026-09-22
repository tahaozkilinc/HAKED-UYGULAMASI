"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { changeOwnPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Şifreniz değiştirildi.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Yeni Şifre</Label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password_again">Yeni Şifre (Tekrar)</Label>
        <Input
          id="password_again"
          name="password_again"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
      </Button>
    </form>
  );
}
