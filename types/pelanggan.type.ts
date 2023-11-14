export interface Pelanggan {
  id: string;
  nama: string;
  nama_merchant: string;
  kode: string;
  telp: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  kode_pos: string;
  latitude: number;
  longitude: number;
  alamat: string;
  kredit_limit: number;
  term_of_payment: number;
  tenor: number;
  image_url: string[];
  confirmed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  user: Sales;
  pelanggan_kategori: PelangganKategori;
}

export interface Sales {
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

export interface PelangganKategori {
  id: string;
  nama: string;
  kode: string;
  deskripsi: string;
  created_at: string;
  updated_at: string;
}
