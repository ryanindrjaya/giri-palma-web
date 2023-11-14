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
  lokasi: Lokasi;
}

export interface Lokasi {
  id: string;
  kode: string;
  nama: string;
  created_at: string;
  updated_at: string;
}
