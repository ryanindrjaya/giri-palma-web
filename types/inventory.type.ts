import { LokasiProduk, Produk } from "./produk.type";

export interface InventoryResponse {
  id: string;
  stok: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryRequest {
  produk_id: string;
  lokasi_id: string;
  stok: number;
}

export interface Inventory {
  id: string;
  stok: number;
  produk: Produk;
  lokasi: LokasiProduk;
  created_at: string;
  updated_at: string;
}
