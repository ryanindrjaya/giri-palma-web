export interface Produk {
  id: string;
  nama: string;
  kode: string;
  deskripsi: string;
  diskon: number;
  on_promo: boolean;
  start_promo_date: any;
  end_promo_date: any;
  sales_fee: number;
  image_url: string[];
  created_at: string;
  updated_at: string;
  default_price: number;
  produk_detail: ProdukDetail[];
  lokasi_produk: LokasiProduk[];
  kategori_produk: KategoriProduk;
}

export interface ProdukDetail {
  detail_id: string;
  tipe: string;
  ukuran: string;
  harga: number;
  produk_id: string;
}

export interface LokasiProduk {
  id: string;
  kode: string;
  nama: string;
  created_at: string;
  updated_at: string;
}

export interface KategoriProduk {
  id: string;
  kode: string;
  nama: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProdukRequest {
  nama: string;
  kode: string;
  deskripsi: string;
  lokasi_produk_id: string;
  kategori_produk_id: string;
  image_url: string[];
  produk_detail: CreateProdukDetail[];
  detail_fullset: CreateProdukDetail[];
  detail_matras: CreateProdukDetail[];
}

export interface CreateProdukDetail {
  tipe: string;
  ukuran?: string;
  harga?: number;
}
