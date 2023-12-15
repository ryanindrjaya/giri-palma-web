export interface LoginResponse {
  status: number;
  message: string;
  data: Data;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Data {
  jwt: string;
  user: User;
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
  role: Role;
  created_at: string;
  updated_at: string;
  lokasi_id: string;
}

export interface Role {
  id: string;
  nama: string;
  master_lokasi: boolean;
  master_pengguna: boolean;
  master_pelanggan: boolean;
  master_produk: boolean;
  inventory: boolean;
  pesanan: boolean;
  pembelian: boolean;
  created_at: string;
  updated_at: string;
}
