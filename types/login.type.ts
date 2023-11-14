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
  role: string;
  created_at: string;
  updated_at: string;
  lokasi_id: string;
}
