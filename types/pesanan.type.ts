import { Pelanggan } from "./pelanggan.type";
import { Produk, ProdukDetail } from "./produk.type";

export interface Pesanan {
  id: string;
  paired: boolean;
  nomor_pesanan: string;
  status_pembayaran: string;
  status: string;
  pesanan_detail: PesananDetail[];
  uang_muka: number;
  uang_tukar_tambah: number;
  total: number;
  catatan: string;
  created_at: string;
  updated_at: string;
  pelanggan: Pelanggan;
  tukar_tambah?: TukarTambah[];
  metode_bayar: string;
  rentang_waktu_pembayaran?: number; // in days
  termin_pembayaran?: number; // in days
  pembayaran_per_minggu?: number;
  nama_leasing?: string;
  user: User;
}

export interface TukarTambah {
  id: string;
  metode_bayar: string;
  kode_bayar: string;
  harga: number;
  image_url: string[];
  created_at: string;
  updated_at: string;
  pesanan_id: string;
}

export interface PesananDetail {
  detail_id: string;
  quantity: number;
  produk_id: string;
  produk: Produk;
  produk_detail: ProdukDetail;
  produk_detail_id: string;
  diskon1: number;
  diskon2: number;
  harga: number;
  harga_jual: number;
  subtotal: number;
  pesanan_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  nama: string;
  kode: string;
  email: string;
  phone: string;
  tanggal_lahir: string;
  alamat: string;
  image_url: any;
  role: string;
  created_at: string;
  updated_at: string;
  lokasi_id: string;
}
