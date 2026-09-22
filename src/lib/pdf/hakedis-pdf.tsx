import path from "node:path";
import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer";

import type { Company, Hakedis, HakedisKalemi } from "@/types/database";
import { DURUM_ETIKETLERI } from "@/lib/constants";
import { formatPara, formatTarih, formatTarihSaat } from "@/lib/format";

Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 32,
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2 solid #1d4ed8",
  },
  logo: { width: 64, height: 64, objectFit: "contain" },
  companyName: { fontSize: 14, fontWeight: 700 },
  title: { fontSize: 16, fontWeight: 700, color: "#1d4ed8", textAlign: "right" },
  subtitle: { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 2 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
    gap: 8,
  },
  infoBox: {
    width: "32%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 6,
  },
  infoLabel: { fontSize: 7, color: "#6b7280", marginBottom: 2 },
  infoValue: { fontSize: 9, fontWeight: 700 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, marginTop: 10 },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#1d4ed8",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  th: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 700,
    color: "#ffffff",
  },
  td: {
    flex: 1,
    padding: 5,
    fontSize: 8,
  },
  noteBox: {
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#fbbf24",
    backgroundColor: "#fffbeb",
    borderRadius: 4,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
  },
  signatureBox: { width: "30%", alignItems: "center" },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#111827",
    width: "100%",
    marginTop: 40,
    paddingTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
});

interface HakedisPdfProps {
  hakedis: Hakedis;
  company: Company;
  kalemler: HakedisKalemi[];
  olusturanAdi: string;
  muhendisAdi: string | null;
}

export function HakedisPdfDocument({ hakedis, company, kalemler, olusturanAdi, muhendisAdi }: HakedisPdfProps) {
  const fields = company.hakedis_schema.fields ?? [];

  return (
    <Document title={`${company.name} - Hakediş #${hakedis.hakedis_no}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop */}
            {company.logo_url && <Image src={company.logo_url} style={styles.logo} />}
            <Text style={styles.companyName}>{company.name}</Text>
          </View>
          <View>
            <Text style={styles.title}>HAKEDİŞ #{hakedis.hakedis_no}</Text>
            <Text style={styles.subtitle}>
              {formatTarih(hakedis.donem_baslangic)} – {formatTarih(hakedis.donem_bitis)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Durum</Text>
            <Text style={styles.infoValue}>{DURUM_ETIKETLERI[hakedis.status]}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>İlgili Mühendis</Text>
            <Text style={styles.infoValue}>{muhendisAdi ?? "-"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Hazırlayan</Text>
            <Text style={styles.infoValue}>{olusturanAdi}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Oluşturulma</Text>
            <Text style={styles.infoValue}>{formatTarihSaat(hakedis.created_at)}</Text>
          </View>
          {hakedis.karar_tarihi && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Karar Tarihi</Text>
              <Text style={styles.infoValue}>{formatTarihSaat(hakedis.karar_tarihi)}</Text>
            </View>
          )}
          {hakedis.revizyon_sayisi > 0 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Revizyon Sayısı</Text>
              <Text style={styles.infoValue}>{hakedis.revizyon_sayisi}</Text>
            </View>
          )}
        </View>

        {hakedis.aciklama && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.infoLabel}>Açıklama</Text>
            <Text>{hakedis.aciklama}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Hakediş Kalemleri</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.th, { flex: 0.3 }]}>#</Text>
            {fields.map((f) => (
              <Text key={f.key} style={styles.th}>
                {f.label}
              </Text>
            ))}
          </View>
          {kalemler.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1 }]}>Kalem girilmemiş.</Text>
            </View>
          ) : (
            kalemler.map((kalem, index) => (
              <View key={kalem.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 0.3 }]}>{index + 1}</Text>
                {fields.map((f) => {
                  const deger = kalem.data[f.key];
                  const gosterim =
                    f.type === "currency"
                      ? formatPara(Number(deger) || 0)
                      : f.type === "date"
                        ? formatTarih(String(deger ?? ""))
                        : String(deger ?? "-");
                  return (
                    <Text key={f.key} style={styles.td}>
                      {gosterim}
                    </Text>
                  );
                })}
              </View>
            ))
          )}
        </View>

        {hakedis.status === "revizyon_istendi" && hakedis.son_revizyon_notu && (
          <View style={styles.noteBox}>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>Mühendis Revizyon Notu</Text>
            <Text>{hakedis.son_revizyon_notu}</Text>
          </View>
        )}

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>Firma Yetkilisi</Text>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>{olusturanAdi}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>Kontrol Mühendisi</Text>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>{muhendisAdi ?? ""}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>Onay</Text>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>
                {hakedis.status === "onaylandi" ? "Onaylandı" : ""}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name} · Hakediş #{hakedis.hakedis_no} · Bu belge {formatTarihSaat(new Date().toISOString())}{" "}
          tarihinde sistem tarafından oluşturulmuştur.
        </Text>
      </Page>
    </Document>
  );
}
