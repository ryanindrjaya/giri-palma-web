"use client";

import useQuery from "@/hooks/useQuery";
import { Descriptions, Image, Input, InputNumber, Modal, Select, Skeleton, Switch, Table, Tooltip } from "antd";
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
import FileUpload from "./Upload";
import { IoIosCloseCircle } from "react-icons/io";
import Cookies from "js-cookie";
import fetcher from "@/lib/axios";

type Props = {
  produkId: string;
  open: boolean;
  onClose: () => void;
  refetch?: () => void;
};
const UKURAN_OPTION = ["90x200", "100x200", "120x200", "160x200", "180x200", "200x200"];
export default function ProdukModal({ refetch, open, produkId, onClose }: Props) {
  if (!produkId) return null;

  const {
    data,
    loading,
    refetch: refetchDetail,
  } = useQuery<Produk>(`/api/admin/produk/${produkId}`, {
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
          children: (
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
          children: (
            <Select
              mode="multiple"
              className="w-full"
              maxTagTextLength={150}
              suffixIcon={null}
              defaultValue={data?.lokasi_produk?.map((item) => item.id)}
              onChange={(value) => {
                const selectedLokasi = lokasi?.filter((item) => value.includes(item.id));

                if (!selectedLokasi) return;
                if (selectedLokasi.length === 0) return;

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
          key: "sales_fee",
          label: "Sales Fee (%)",
          children: `${data.sales_fee}%`,
          span: 2,
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
      title: "Sub Tipe",
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
      key: "diskon1",
      title: "Diskon 1",
      width: 100,
      render: (text, item) => {
        return (
          <InputNumber
            className="w-full"
            defaultValue={item.diskon1}
            onChange={_.debounce((value) => {
              const detailBody: ProdukDetail = {
                ...item,
                diskon1: value,
              };

              edit({ produk_detail: [detailBody] }).catch((err) => {
                console.error("Error edit diskon1 produk: ", err);
              });
            }, 1000)}
            onFocus={(e) => e.target.select()}
            formatter={(value) => `${value}%`}
            precision={2}
            parser={(value) => parseFloat(value?.replace("%", "") || "0")}
          />
        );
      },
    },
    {
      key: "diskon2",
      title: "Diskon 2",
      width: 100,
      render: (text, item) => {
        return (
          <InputNumber
            className="w-full"
            defaultValue={item.diskon2}
            onChange={_.debounce((value) => {
              const detailBody: ProdukDetail = {
                ...item,
                diskon2: value,
              };

              edit({ produk_detail: [detailBody] }).catch((err) => {
                console.error("Error edit diskon1 produk: ", err);
              });
            }, 1000)}
            onFocus={(e) => e.target.select()}
            formatter={(value) => `${value}%`}
            precision={2}
            parser={(value) => parseFloat(value?.replace("%", "") || "0")}
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

  const deleteImage = async (image: string) => {
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/upload/produk`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produk_id: data?.id,
          filename: image,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Gagal menghapus gambar produk");

      refetchDetail();
    } catch (error) {
      console.log(error);
    }
  };

  const uploadImage = async (files: File[]) => {
    const jwt = Cookies.get("jwt");
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("produk_id", data?.id || "");

    const resUpload = await fetcher
      .post(`/api/admin/upload/produk`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${jwt}`,
        },
      })
      .catch((error) => {
        console.log(error);
      });

    if (resUpload) {
      refetchDetail();
    }
  };

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
      {loading || loadingKategori || loadingLokasi ? (
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
                <div key={`produk-image-${idx}`} className="w-[200px] h-[200px] relative inline-block mr-3 mb-3">
                  <Image
                    key={`gambar-produk-${idx}`}
                    src={item}
                    width={200}
                    height={200}
                    className="object-cover object-center rounded-md relative"
                  />
                  <Tooltip className="absolute -top-2 -right-2" title="Hapus gambar">
                    <span
                      className="z-30 h-6 text-red-500  text-2xl cursor-pointer bg-white rounded-full"
                      onClick={() => {
                        deleteImage(item);
                      }}
                    >
                      <IoIosCloseCircle />
                    </span>
                  </Tooltip>
                </div>
              ))}
              <div>
                <FileUpload setFile={(files) => uploadImage(files)} className="w-[200px] h-[200px]" />
              </div>
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
