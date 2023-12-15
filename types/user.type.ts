import { Role } from "./login.type";

export interface User {
  id: string;
  nama: string;
  kode: string;
  username: string;
  email: string;
  phone: string;
  tanggal_lahir: string;
  alamat: string;
  image_url: any;
  created_at: string;
  updated_at: string;
  lokasi_id: string;
  lokasi: Lokasi;
  role: Role;
}

export interface Lokasi {
  id: string;
  kode: string;
  nama: string;
  created_at: string;
  updated_at: string;
}
