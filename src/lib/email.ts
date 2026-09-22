import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

interface HakedisAtamaMailInput {
  muhendisEmail: string;
  muhendisAdi: string;
  firmaAdi: string;
  hakedisNo: number;
  donemBaslangic: string;
  donemBitis: string;
  hakedisUrl: string;
}

/**
 * Mühendise yeni/yeniden gönderilen bir hakedişi bildirir. RESEND_API_KEY
 * tanımlı değilse sessizce hiçbir şey yapmaz — e-posta gönderimi bu
 * uygulamanın çekirdek işlevini (hakediş kaydı) engellememelidir.
 */
export async function sendHakedisAtamaMaili(input: HakedisAtamaMailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY tanımlı değil; hakediş atama e-postası gönderilmedi.");
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "Hakediş Takip <onboarding@resend.dev>";

  const gövde = `
    <div style="font-family: sans-serif; font-size: 14px; color: #111;">
      <p>Merhaba ${input.muhendisAdi || ""},</p>
      <p><strong>${input.firmaAdi}</strong> firmasının <strong>#${input.hakedisNo}</strong> numaralı hakedişi
      (${input.donemBaslangic} – ${input.donemBitis} dönemi) incelemenize gönderildi.</p>
      <p><a href="${input.hakedisUrl}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;">
        Hakedişi Görüntüle
      </a></p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.muhendisEmail],
        subject: `${input.firmaAdi} — Hakediş #${input.hakedisNo} onayınızı bekliyor`,
        html: gövde,
      }),
    });

    if (!res.ok) {
      console.error("Hakediş atama e-postası gönderilemedi:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Hakediş atama e-postası gönderilemedi:", e);
  }
}
