import { inria } from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { DetailPembelian, Pembelian, PembelianDetail } from "@/types/pembelian.type";
import dayjs from "dayjs";
import React, { useMemo } from "react";

type Props = {
  data: DetailPembelian | null;
};

const PrintPO = React.forwardRef(({ data }: Props, ref: any) => {
  const alamat = "Perum Giri Palma II no. 88 (Tidar Atas) Malang";
  const telp = "(0341) 5071435, 555886";
  const hp = "0818387438 (P. Made), 081232577889 (P. Ragiel)";

  const topBorder = {
    borderTop: "1px solid black",
  };

  const borderBottom = {
    borderBottom: "1px solid black",
  };

  const verticalBorder = {
    borderBottom: "0.25px solid black",
    borderTop: "0.25px solid black",
  };

  const rightBorder = {
    borderRight: "0.25px solid black",
  };

  const getHarga = (item: PembelianDetail) => {
    let harga = item.harga;

    if (item.diskon1 > 0) {
      harga = harga - harga * (item.diskon1 / 100);
    }

    if (item.diskon2 > 0) {
      harga = harga - harga * (item.diskon2 / 100);
    }

    return parseHarga(Math.round(harga || 0));
  };

  const detail = Array.from({ length: 8 }, (_, i) => data?.pembelian_detail[i]); // create array of 8 items
  return (
    <section
      ref={ref}
      style={{
        width: "210mm",
        height: "144.5mm",
        maxHeight: "144.5mm",
        fontFamily: "'Inria Sans', sans-serif",
      }}
      className={`border-black relative rounded-sm py-1 border-solid border`}
    >
      <img
        className="w-1/2 opacity-10 absolute rounded-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        src="/images/logo_gp_full.jpg"
      />
      <div className="flex px-1">
        <div className="flex-[0.5] flex flex-col justify-center items-center">
          <p className="m-0 text-base font-bold">SURAT PO</p>
          <p className="m-0 text-xs font-bold tracking-wide">Giri Palma Mebel</p>
          <p className="m-0 text-xs text-center">{alamat}</p>
          <p className="m-0 text-xs text-center">Telp. {telp}</p>
          <p className="m-0 text-xs text-center">HP. {hp}</p>
          <p className="m-0 text-xs text-center font-bold italic">(Menerima Kredit dan Tukar Tambah)</p>

          <p className="m-0 text-xs self-start mt-1">
            <span className="font-bold">Nota</span>: {data?.nomor_pembelian}
          </p>
        </div>
        <div className="flex-[0.5]">
          <p className="uppercase text-right m-0 text-xs">Malang, {dayjs().format("DD/MM/YYYY")}</p>
          <div className="flex gap-1 mb-2">
            <p className="m-0 text-xs font-bold min-w-[80px]">Tuan</p>
            <p className="m-0 text-xs">:</p>
            <div style={borderBottom} className="border-black w-3/4">
              <p className="m-0 text-xs">
                {data?.pelanggan.nama} ({data?.pelanggan.nama_merchant})
              </p>
            </div>
          </div>
          <div className="flex gap-1 mb-2">
            <p className="m-0 text-xs font-bold min-w-[80px]">Alamat</p>
            <p className="m-0 text-xs">:</p>
            <div style={borderBottom} className="border-black w-3/4">
              <p className="m-0 text-xs">
                {data?.pelanggan.alamat}, {data?.pelanggan.provinsi}, {data?.pelanggan.kota},{" "}
                {data?.pelanggan.kecamatan}, {data?.pelanggan.kelurahan}, {data?.pelanggan.kode_pos}
              </p>
            </div>
          </div>
          <div className="flex gap-1 mb-2">
            <p className="m-0 text-xs font-bold min-w-[80px]">Telp</p>
            <p className="m-0 text-xs">:</p>
            <div style={borderBottom} className="border-black w-3/4">
              <p className="m-0 text-xs">{data?.pelanggan.telp}</p>
            </div>
          </div>
        </div>
      </div>
      <table className="border-collapse w-full">
        <tr style={verticalBorder}>
          <th style={rightBorder} className="text-xs">
            BANYAKNYA
          </th>
          <th style={rightBorder} className="text-xs">
            TYPE
          </th>
          <th style={rightBorder} className="text-xs">
            UKURAN
          </th>
          <th style={rightBorder} className="text-xs">
            WARNA
          </th>
          <th style={rightBorder} className="text-xs">
            HARGA
          </th>
          <th className="text-xs">JUMLAH</th>
        </tr>
        {detail?.map((item, index) => (
          <tr key={index} style={verticalBorder}>
            <td style={rightBorder} className="text-xs text-center">
              {item?.quantity ? item.quantity : ""}
            </td>
            <td style={rightBorder} className="text-xs text-left pl-1">
              {item ? `${item.produk.nama} (${item.produk_detail.tipe})` : <span className="opacity-0"></span>}
            </td>
            <td style={rightBorder} className="text-xs text-center">
              {item?.produk_detail.ukuran}
            </td>
            <td style={rightBorder} className="text-xs text-center"></td>
            <td style={rightBorder} className="text-xs text-right pr-1">
              {item?.harga ? `Rp ${getHarga(item)}` : ""}
            </td>
            <td className="text-xs text-right pr-1">{item?.subtotal ? `Rp ${parseHarga(item.subtotal)}` : ""}</td>
          </tr>
        ))}
        <tr>
          <td className="px-2" colSpan={5} style={rightBorder}>
            <div className="flex justify-between">
              <div className="flex gap-1 w-1/2">
                <p className="m-0 text-xs">Catatan: </p>
                <p className="m-0 text-xs font-bold">{data?.catatan}</p>
              </div>
              <p className="m-0 text-xs font-bold">JUMLAH</p>
            </div>
          </td>
          <td style={borderBottom} className="text-xs text-right pr-1">
            {data?.total ? `Rp ${parseHarga(data.total)}` : ""}
          </td>
        </tr>
        <tr>
          <td className="px-2" colSpan={5} style={rightBorder}>
            <div className="flex justify-end">
              <p className="m-0 text-xs font-bold">UM</p>
            </div>
          </td>
          <td style={borderBottom} className="text-xs text-right pr-1">
            {data?.uang_muka ? `Rp ${parseHarga(data.uang_muka)}` : ""}
          </td>
        </tr>
        <tr style={borderBottom}>
          <td className="px-2" colSpan={5} style={rightBorder}>
            <div className="flex justify-end">
              <p className="m-0 text-xs font-bold">SISA BAYAR</p>
            </div>
          </td>
          <td style={borderBottom} className="text-xs text-right pr-1">
            {data?.sisa_pembayaran ? `Rp ${parseHarga(data.sisa_pembayaran)}` : ""}
          </td>
        </tr>
      </table>

      <div style={borderBottom} className="w-full flex justify-around mt-2 pb-24">
        <p className="m-0 font-bold text-xs">TANDA TANGAN PEMBELI</p>
        <p className="m-0 font-bold text-xs">TANDA TANGAN PENJUAL</p>
      </div>

      <div className="flex justify-between px-2">
        <ul className="list-disc pl-5 text-xs">
          <li>Barang yang sudah dibeli/dipesan tidak dapat ditukar/dikembalikan</li>
          <li>DP dibawah 10% tidak dapat mengikat harga</li>
          <li>Harga sudah termasuk PPN 11%</li>
        </ul>

        <p className="m-0 mt-3 text-xs">
          Pembayaran dapat dilakukan secara transfer ke rekening <br />
          mandiri a/n. Giri Palma Mebel no. rek. 144001 218 6653 <br />
          BCA a/n. Made Raji Mahendra no. rek. 440 126 7179
        </p>
      </div>
    </section>
  );
});

PrintPO.displayName = "PrintPO"; // Tell React to display this name in the DevTools

export default PrintPO;
