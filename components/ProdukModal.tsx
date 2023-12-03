"use client";

import useQuery from "@/hooks/useQuery";
import { Descriptions, Image, Input, InputNumber, Modal, Select, Skeleton, Switch, Table } from "antd";
import React, { useCallback, useMemo } from "react";
import SkeletonTable from "./SkeletonTable";
import { KategoriProduk, LokasiProduk, Produk, ProdukDetail } from "@/types/produk.type";
import dayjs from "dayjs";
import { ColumnsType } from "antd/es/table";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { parseToOption } from "@/lib/helpers/parseToOption";
import useMutation from "@/hooks/useMutation";
import _ from "lodash";
import { DescriptionsItemType } from "antd/es/descriptions";

type Props = {
  produkId: string;
  open: boolean;
  onClose: () => void;
  refetch?: () => void;
};
const UKURAN_OPTION = ["90x200", "100x200", "120x200", "160x200", "180x200", "200x200"];
export default function ProdukModal({ refetch, open, produkId, onClose }: Props) {
  if (!produkId) return null;

  const { data, loading, error } = useQuery<Produk>(`/api/admin/produk/${produkId}`, {
    trigger: open,
  });
  const { data: kategori, loading: loadingKategori } = useQuery<KategoriProduk[]>("/api/admin/kategori", {
    trigger: open,
  });
  const { data: lokasi, loading: loadingLokasi } = useQuery<LokasiProduk[]>("/api/admin/lokasi-produk", {
    trigger: open,
  });
  const [edit] = useMutation(`/api/admin/produk/${produkId}`, "put", {
    onSuccess: () => {
      if (refetch) refetch();
    },
  });

  const detail = useMemo(() => {
    if (data) {
      const detailData = data.produk_detail || [];

      const types = detailData.reduce<string[]>((acc, curr) => {
        if (!acc.includes(curr.tipe)) {
          acc.push(curr.tipe);
        }

        return acc;
      }, []);

      return types.reduce<{ [key: string]: ProdukDetail[] }>((acc, curr) => {
        acc[curr] = detailData.filter((item) => item.tipe === curr);

        return acc;
      }, {});
    } else {
      return {};
    }
  }, [data]);

  const getProductDescription = useCallback(() => {
    if (data) {
      return [
        {
          key: "nama",
          label: "Nama",
          children: (
            <Input
              type="text"
              defaultValue={data.nama}
              onChange={_.debounce((e) => {
                edit({ nama: e.target.value }).catch((err) => {
                  console.error("Error edit nama produk: ", err);
                });
              }, 1000)}
            />
          ),
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
          children: loadingKategori ? (
            <Skeleton.Input active block />
          ) : (
            <Select
              className="w-full"
              suffixIcon={null}
              defaultValue={data.kategori_produk?.nama}
              onChange={(value) => {
                edit({ kategori_produk_id: value }).catch((err) => {
                  console.error("Error edit kategori produk: ", err);
                });
              }}
              options={parseToOption(kategori || [], "id", "nama")}
            />
          ),
          span: 4,
        },
        {
          key: "lokasi",
          label: "Lokasi",
          children: loadingLokasi ? (
            <Skeleton.Input active block />
          ) : (
            <Select
              mode="multiple"
              className="w-full"
              maxTagTextLength={150}
              suffixIcon={null}
              defaultValue={data?.lokasi_produk?.map((item) => item.id)}
              onChange={(value) => {
                const selectedLokasi = lokasi?.filter((item) => value.includes(item.id));

                if (!selectedLokasi) return;

                edit({ lokasi_produk: selectedLokasi }).catch((err) => {
                  console.error("Error edit lokasi produk: ", err);
                });
              }}
              allowClear
              onClear={() => {
                edit({ lokasi_produk: [] }).catch((err) => {
                  console.error("Error edit lokasi produk: ", err);
                });
              }}
              options={parseToOption(lokasi || [], "id", "nama")}
            />
          ),
          span: 4,
        },
        {
          key: "on_promo",
          label: "On Promo",
          children: (
            <Switch
              checkedChildren="Ya"
              unCheckedChildren="Tidak"
              defaultChecked={data.on_promo}
              onChange={(checked) => edit({ on_promo: checked })}
            />
          ),
          span: 2,
        },
        {
          key: "diskon",
          label: "Diskon (%)",
          children: (
            <InputNumber
              onFocus={(e) => e.target.select()}
              formatter={(value) => `${value}%`}
              parser={(value) => parseInt(value?.replace("%", "") || "0")}
              defaultValue={data.diskon}
              onChange={_.debounce((value) => edit({ diskon: value }), 1000)}
            />
          ),
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
          children: (
            <Input.TextArea
              className="w-full"
              defaultValue={data.deskripsi}
              onChange={_.debounce((e) => {
                edit({ deskripsi: e.target.value }).catch((err) => {
                  console.error("Error edit deskripsi produk: ", err);
                });
              }, 1000)}
            />
          ),
          span: 4,
        },
      ] as DescriptionsItemType[];
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
      render: (text, item) => {
        return (
          <Input
            className="w-full"
            defaultValue={item.ukuran}
            onChange={_.debounce((e) => {
              const detailBody: ProdukDetail = {
                ...item,
                ukuran: e.target.value,
              };

              edit({ produk_detail: [detailBody] }).catch((err) => {
                console.error("Error edit ukuran produk: ", err);
              });
            }, 1000)}
            onFocus={(e) => e.target.select()}
          />
        );
      },
    },
    {
      key: "harga",
      title: "Harga",
      width: 200,
      render: (text, item) => {
        return (
          <InputNumber
            className="w-full"
            prefix="Rp "
            // readOnly
            defaultValue={item.harga}
            onChange={_.debounce((value) => {
              const detailBody: ProdukDetail = {
                ...item,
                harga: value,
              };

              edit({ produk_detail: [detailBody] }).catch((err) => {
                console.error("Error edit harga produk: ", err);
              });
            }, 1000)}
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

          {Object.keys(detail).map((item, idx) => (
            <div className="mt-5" key={`produkdetail-${idx}`}>
              <p className="font-bold text-base">Detail {item}</p>
              <Table
                rowKey={(row) => row.detail_id}
                bordered
                pagination={false}
                size="small"
                columns={detailColumns}
                dataSource={detail?.[item]}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
