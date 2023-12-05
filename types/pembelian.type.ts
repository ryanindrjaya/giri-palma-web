import { User } from "./login.type";
import { Pelanggan } from "./pelanggan.type";
import { Pesanan } from "./pesanan.type";
import { Produk, ProdukDetail } from "./produk.type";

export interface Pembelian {
  id: string;
  nomor_pembelian: string;
  status_pembayaran: string;
  status: string;
  uang_muka: number;
  total: number;
  sisa_pembayaran: number;
  riwayat_pembayaran: RiwayatPembayaran[];
  pembelian_detail: DetailPembelian[];
  catatan: string;
  created_at: string;
  updated_at: string;
  pelanggan: Pelanggan;
  user: User;
}

export interface RiwayatPembayaran {
  id: string;
  tanggal_bayar: string;
  nomor_pembayaran: string;
  metode_bayar: string;
  kode_bayar: any;
  nilai_bayar: number;
  created_at: string;
  updated_at: string;
  is_confirmed: boolean;
  is_paid: boolean;
}

export interface DetailPembelian {
  id: string;
  nomor_pembelian: string;
  status_pembayaran: string;
  status: string;
  uang_muka: number;
  total: number;
  sisa_pembayaran: number;
  catatan: string;
  metode_bayar: string;
  created_at: string;
  updated_at: string;
  termin_pembayaran: number;
  rentang_waktu_pembayaran: number;
  pesanan: Pesanan;
  pelanggan: Pelanggan;
  user: User;
  riwayat_pembayaran: RiwayatPembayaran[];
  pembelian_detail: PembelianDetail[];
}

export interface RiwayatPembayaran {
  id: string;
  tanggal_bayar: string;
  nomor_pembayaran: string;
  metode_bayar: string;
  kode_bayar: any;
  nilai_bayar: number;
  created_at: string;
  updated_at: string;
  is_confirmed: boolean;
  is_paid: boolean;
}

export interface PembelianDetail {
  detail_id: string;
  quantity: number;
  produk_id: string;
  produk: Produk;
  produk_detail_id: string;
  produk_detail: ProdukDetail;
  diskon: number;
  harga: number;
  harga_jual: number;
  subtotal: number;
  pembelian_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePembelian {
  nomor_pembelian?: string;
  pesanan_id: string;
  pelanggan_id: string;
  user_id: string;
  pembelian_detail: CreatePembelianDetail[];
  status: string;
  status_pembayaran: string;
  catatan: string;
}

export interface CreatePembelianDetail {
  produk_id: string;
  produk_detail_id: string;
  diskon1: number;
  diskon2: number;
  quantity: number;
  immutable_quantity?: number;
  produk?: Produk;
  produk_detail?: ProdukDetail;
  subtotal?: number;
}
