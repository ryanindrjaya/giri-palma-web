import useQuery from "@/hooks/useQuery";
import { Descriptions, Image, InputNumber, Modal, Select, Table } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import SkeletonTable from "./SkeletonTable";
import { Produk, ProdukDetail } from "@/types/produk.type";
import dayjs from "dayjs";
import { ColumnsType } from "antd/es/table";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { parseToOption } from "@/lib/helpers/parseToOption";

type Props = {
  produkId: string;
  open: boolean;
  onClose: () => void;
};
const UKURAN_OPTION = ["90x200", "100x200", "120x200", "160x200", "180x200", "200x200"];
export default function ProdukModal({ open, produkId, onClose }: Props) {
  const { data, loading, error } = useQuery<Produk>(`/api/admin/produk/${produkId}`);

  const detail = useMemo(() => {
    if (data) {
      const detailData = data.produk_detail || [];

      const filteredFullset = detailData.filter((item) => item.tipe === "Fullset");
      const filteredMatrasOnly = detailData.filter((item) => item.tipe === "Matras Only");

      return {
        fullset: filteredFullset || [],
        matrasOnly: filteredMatrasOnly || [],
      };
    }
  }, [data]);

  const getProductDescription = useCallback(() => {
    if (data) {
      return [
        {
          key: "nama",
          label: "Nama",
          children: data.nama,
          span: 2,
        },
        {
          key: "kode",
          label: "Kode Produk",
          children: data.kode,
          span: 2,
        },
        {
          key: "kategori",
          label: "Kategori",
          children: data.kategori_produk?.nama,
          span: 4,
        },
        {
          key: "lokasi",
          label: "Lokasi",
          children: data.lokasi_produk?.nama,
          span: 4,
        },
        {
          key: "on_promo",
          label: "On Promo",
          children: data.on_promo ? "Ya" : "Tidak",
          span: 2,
        },
        {
          key: "diskon",
          label: "Diskon (%)",
          children: `${data.diskon}%`,
          span: 1,
        },
        {
          key: "sales_fee",
          label: "Sales Fee (%)",
          children: `${data.sales_fee}%`,
          span: 1,
        },
        {
          key: "deskripsi",
          label: "Deskripsi",
          children: data.deskripsi,
          span: 4,
        },
      ];
    }
  }, [data]);

  const detailColumns: ColumnsType<ProdukDetail> = [
    {
      key: "tipe",
      title: "Tipe",
      dataIndex: "tipe",
      width: 200,
    },
    {
      key: "tipe",
      title: "Ukuran",
      width: 200,
      render: (_, item) => {
        return (
          <Select
            className="w-full"
            defaultValue={item.ukuran}
            onChange={(value) => {
              item.ukuran = value;
            }}
            disabled
            options={parseToOption(UKURAN_OPTION)}
          />
        );
      },
    },
    {
      key: "harga",
      title: "Harga",
      width: 200,
      render: (_, item) => {
        return (
          <InputNumber
            className="w-full"
            prefix="Rp "
            readOnly
            defaultValue={item.harga}
            onFocus={(e) => e.target.select()}
            formatter={(value) => parseHarga(value || 0)}
            parser={(value) => Number(value?.replace(/[^0-9]/g, "") || 0)}
          />
        );
      },
    },
  ];

  return (
    <Modal
      okButtonProps={{ hidden: true, style: { display: "none" } }}
      cancelText="Tutup"
      title="Produk Detail"
      width={1000}
      open={open}
      onOk={onClose}
      onCancel={onClose}
    >
      {loading ? (
        <SkeletonTable />
      ) : (
        <div>
          <p className="text-gray-400 italic m-0">
            Dibuat pada: {dayjs(data?.created_at).format("DD MMMM YYYY HH:mm:ss")}
          </p>
          <p className="text-gray-400 italic m-0 mb-5">
            Terakhir diubah: {dayjs(data?.updated_at).format("DD MMMM YYYY HH:mm:ss")}
          </p>

          <Descriptions column={4} size="small" bordered items={getProductDescription()} />

          <div className="mt-5">
            <p className="font-bold text-base">Gambar Produk</p>
            <Image.PreviewGroup>
              {data?.image_url?.map((item, idx) => (
                <Image key={`gambar-produk-${idx}`} src={item} width={200} />
              ))}
            </Image.PreviewGroup>
          </div>

          <div className="mt-5">
            <p className="font-bold text-base">Detail Fullset</p>
            <Table bordered pagination={false} size="small" columns={detailColumns} dataSource={detail?.fullset} />
          </div>
          <div className="mt-5">
            <p className="font-bold text-base">Detail Matras Only</p>
            <Table bordered pagination={false} size="small" columns={detailColumns} dataSource={detail?.matrasOnly} />
          </div>
        </div>
      )}
    </Modal>
  );
}
