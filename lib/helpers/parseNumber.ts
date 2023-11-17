export function parseHarga(harga: number | string) {
  if (typeof harga === "string") {
    return harga.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return Math.round(harga)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
