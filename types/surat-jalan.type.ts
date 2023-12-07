import { DetailPembelian } from "./pembelian.type";

export interface SuratJalanType {
  id: string;
  nomor_surat_jalan: string;
  status: string;
  created_at: string;
  updated_at: string;
  pembelian_id: string;
  pembelian?: DetailPembelian;
}
