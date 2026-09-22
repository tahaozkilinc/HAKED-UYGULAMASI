import { Suspense } from "react";
import Image from "next/image";

import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image
            src="/sunar-logo.png"
            alt="Sunar"
            width={200}
            height={92}
            priority
            className="mb-2 h-auto w-44"
          />
          <CardTitle className="text-xl">Hakediş Takip Sistemi</CardTitle>
          <CardDescription>Devam etmek için giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Hesabınız yoksa sistem yöneticinizle iletişime geçin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
