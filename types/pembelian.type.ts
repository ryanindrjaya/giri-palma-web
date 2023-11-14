import { User } from "./login.type";
import { Pelanggan } from "./pelanggan.type";
import { Produk, ProdukDetail } from "./produk.type";

export interface Pembelian {
  id: string;
  nomor_pembelian: string;
  status_pembayaran: string;
  status: string;
  uang_muka: number;
  total: number;
  sisa_pembayaran: number;
  catatan: string;
  created_at: string;
  updated_at: string;
  pelanggan: Pelanggan;
  user: User;
}

export interface CreatePembelian {
  nomor_pembelian: string;
  pesanan_id: string;
  pelanggan_id: string;
  user_id: string;
  pembelian_detail: CreatePembelianDetail[];
}

export interface CreatePembelianDetail {
  produk_id: string;
  produk_detail_id: string;
  diskon: number;
  quantity: number;
  immutable_quantity?: number;
  produk?: Produk;
  produk_detail?: ProdukDetail;
  subtotal?: number;
}
