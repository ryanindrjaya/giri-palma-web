import { Produk } from "./produk.type";

export interface BannerType {
  id: string;
  title: string;
  deskripsi: string;
  image_url: string;
  produk_id: string;
  produk: Produk;
  created_at: string;
  updated_at: string;
}
