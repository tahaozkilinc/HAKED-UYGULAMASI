// Bu dosya, supabase/migrations altındaki şema ile elle senkron tutulur.
// Supabase projesi bağlandıktan sonra `supabase gen types typescript` ile
// otomatik üretilen dosyayla değiştirilmesi önerilir.

export type UserRole = "admin" | "firma" | "muhendis" | "satin_alma";

export type HakedisStatus =
  | "taslak"
  | "incelemede"
  | "revizyon_istendi"
  | "onaylandi"
  | "silindi";

export type HareketTipi =
  | "olusturuldu"
  | "guncellendi"
  | "gonderildi"
  | "revizyon_istendi"
  | "revize_edildi"
  | "onaylandi"
  | "silindi"
  | "yorum"
  | "ek_eklendi";

export type SchemaFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "computed";

export interface HakedisSchemaField {
  key: string;
  label: string;
  type: SchemaFieldType;
  required?: boolean;
  unit?: string;
  options?: string[];
  /** type = "computed" için: diğer alan key'lerini kullanan basit çarpım/toplam formülü, örn. "miktar * birim_fiyat" */
  formula?: string;
  help?: string;
}

export interface HakedisSchema {
  fields: HakedisSchemaField[];
  /** Toplam tutarı belirleyen alan key'i (varsayılan: "tutar") */
  amountField?: string;
}

export interface KesintiKalemi {
  ad: string;
  tutar: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  short_code: string | null;
  currency: string;
  is_active: boolean;
  hakedis_schema: HakedisSchema;
  notes: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: string;
  company_id: string;
  full_name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyTag {
  company_id: string;
  tag_id: string;
}

export interface MuhendisCompanyAssignment {
  id: string;
  muhendis_id: string;
  company_id: string;
  created_at: string;
}

export interface Hakedis {
  id: string;
  company_id: string;
  hakedis_no: number;
  donem_baslangic: string;
  donem_bitis: string;
  status: HakedisStatus;
  ara_toplam: number;
  kesintiler: KesintiKalemi[];
  kesinti_toplam: number;
  kdv_orani: number;
  kdv_tutari: number;
  net_tutar: number;
  kumulatif_tutar: number;
  aciklama: string | null;
  revizyon_sayisi: number;
  son_revizyon_notu: string | null;
  created_by: string;
  muhendis_id: string | null;
  karar_veren_id: string | null;
  karar_tarihi: string | null;
  created_at: string;
  updated_at: string;
}

export interface HakedisKalemi {
  id: string;
  hakedis_id: string;
  sira_no: number;
  data: Record<string, unknown>;
  tutar: number;
  created_at: string;
  updated_at: string;
}

export interface HakedisEk {
  id: string;
  hakedis_id: string;
  dosya_adi: string;
  storage_path: string;
  boyut: number | null;
  yukleyen_id: string | null;
  created_at: string;
}

export interface HakedisHareket {
  id: string;
  hakedis_id: string;
  islem_tipi: HareketTipi;
  aciklama: string | null;
  yapan_id: string | null;
  onceki_durum: HakedisStatus | null;
  yeni_durum: HakedisStatus | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Supabase istemcisi için minimal Database tipi (elle bakımı yapılan alt küme)
// postgrest-js'in GenericTable şekliyle uyumlu olması için her tabloya
// Relationships: [] eklenir; Views/Functions boş bırakılır.
// ---------------------------------------------------------------------------
type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }, Partial<Profile>>;
      tags: Table<Tag, Partial<Tag>>;
      companies: Table<Company, Partial<Company>>;
      company_tags: Table<CompanyTag, CompanyTag, Partial<CompanyTag>>;
      muhendis_company_assignments: Table<
        MuhendisCompanyAssignment,
        Partial<MuhendisCompanyAssignment>
      >;
      hakedisler: Table<Hakedis, Partial<Hakedis>>;
      hakedis_kalemleri: Table<HakedisKalemi, Partial<HakedisKalemi>>;
      hakedis_ekler: Table<HakedisEk, Partial<HakedisEk>>;
      hakedis_hareketleri: Table<HakedisHareket, Partial<HakedisHareket>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
