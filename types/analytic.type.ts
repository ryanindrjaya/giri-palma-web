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
