import { Pelanggan as PelangganType } from "./pelanggan.type";

export interface AnalyticRequest {
  option: string;
  started_time: string;
  ended_time: string;
}

export interface Analytic {
  pesanan: Pesanan;
  pembelian: Pembelian;
  pelanggan: Pelanggan;
  all_merchant: AllMerchant;
  new_merchant: NewMerchant;
}

export interface AllMerchant {
  total_new_merchant_transaction: number;
  total_old_merchant_transaction: number;
  detail: any;
}

export interface NewMerchant {
  total_new_merchant_transaction: number;
  detail: any[];
}

export interface Pesanan {
  jumlah_pesanan: number;
  total_pesanan: number;
  chart_data: ChartData[];
}

export interface Pembelian {
  jumlah_pembelian: number;
  total_pembelian: number;
  chart_data: ChartData[];
}

export interface Pelanggan {
  total_pelanggan: number;
  chart_data: ChartData[];
  terbaru: PelangganType[];
}
export interface ChartData {
  time: string;
  total_nominal: number;
}
