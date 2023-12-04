"use client";

import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Input, InputNumber, Popconfirm, Switch, Table, Tag, notification } from "antd";
import { GiSettingsKnobs } from "react-icons/gi";
import { AiOutlinePlus, AiOutlineEdit } from "react-icons/ai";
import React, { useState, useEffect } from "react";
import useQuery from "@/hooks/useQuery";
import SkeletonTable from "@/components/SkeletonTable";
import type { ColumnsType } from "antd/es/table";
import { BsFillTrashFill } from "react-icons/bs";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import { Produk } from "@/types/produk.type";
import { useRouter } from "next/router";
import { NotificationInstance } from "antd/es/notification/interface";
import ProdukModal from "@/components/ProdukModal";

type Props = {
  notificationApi: NotificationInstance;
};

export default function Produk({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<Produk[]>([]);
  const { data, loading, refetch } = useQuery<Produk[]>("/api/admin/produk");
  const [deleteProduk, { loading: loadingDelete }] = useMutation("/api/admin/produk", "delete");
  const [editProduk, { loading: loadingEdit }] = useMutation("/api/admin/produk", "put");

  const [produkId, setProdukId] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedSearchVal) {
      refetch({ nama: debouncedSearchVal });
    } else {
      refetch();
    }
  }, [debouncedSearchVal]);

  const columns: ColumnsType<Produk> = [
    {
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Lokasi",
      key: "nama",
      render: (_v, item) => {
        const lokasi = item?.lokasi_produk || [];

        return (
          <ul className="m-0 pl-5">
            {lokasi.map((item) => (
              <li key={item.id}>{item.nama}</li>
            ))}
          </ul>
        );
      },
    },
    {
      title: "Kode",
      dataIndex: "kode",
      key: "email",
    },
    {
      title: "Kategori",
      key: "kategori",
      width: 100,
      align: 'center',
      render: (_v, item) => {
        const kategori = item?.kategori_produk?.nama || '-'

        return (
          <Tag className={inria.className} color={kategori === "Springbed" ? "geekblue-inverse" : "gold-inverse"}>
            {kategori}
          </Tag>
        );
      },
    },
    {
      title: "On Promo",
      key: "on_promo",
      width: 80,
      render: (_v, item) => {
        const promo = item.on_promo;

        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Switch
              defaultChecked={promo}
              onChange={(checked) => {
                editProduk({ on_promo: checked }, item.id);
                item.on_promo = checked;
              }}
            />
          </div>
        );
      },
    },
    {
      title: "Diskon",
      key: "diskon",
      render: (_v, item) => (
        <InputNumber
          disabled={!item.on_promo}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.target.select()}
          defaultValue={item.diskon}
          onBlur={(e) => editProduk({ diskon: Number(e.target.value || 0) }, item.id)}
          suffix="%"
        />
      ),
    },
    {
      title: "Action",
      align: "center",
      render: (_, item) => (
        <div className="flex justify-center items-center gap-2">
          <Button type="primary" className="flex p-1 justify-center items-center">
            <AiOutlineEdit size={18} />
          </Button>
        </div>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Produk[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deleteProduk(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus produk",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus produk",
        placement: "topRight",
      });
    }
  };

  useEffect(() => {
    if (router.query?.id) {
      setProdukId(router.query.id as string);
    }
  }, [router.query]);

  return (
    <DashboardLayout
      title="Produk"
      header={
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-2">
            <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari produk" />
            <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
              <GiSettingsKnobs size={18} />
            </Button>
            <Popconfirm
              title="Hapus produk"
              okButtonProps={{ danger: true, loading: loadingDelete }}
              description="Apakah anda yakin ingin menghapus produk yang dipilih?"
              onConfirm={handleBulkDelete}
            >
              <Button
                danger
                loading={loadingDelete}
                disabled={loadingDelete}
                className={`px-2 flex items-center border border-gray-400 transition-opacity duration-100 rounded-md bg-white cursor-pointer  ${
                  selectedRow.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                } `}
              >
                <BsFillTrashFill size={18} />
              </Button>
            </Popconfirm>
          </div>
          <Button
            onClick={() => {
              router.push("/dashboard/produk/tambah");
            }}
            type="primary"
            className="flex gap-2 items-center"
          >
            <div className="flex items-center gap-2">
              <AiOutlinePlus size={18} />
              <span>Tambah Produk</span>
            </div>
          </Button>
        </div>
      }
    >
      <ProdukModal refetch={refetch} open={!!produkId} onClose={() => setProdukId(null)} produkId={produkId || ""} />
      {loading ? (
        <SkeletonTable />
      ) : (
        <Table
          bordered
          rowSelection={{
            type: "checkbox",
            ...rowSelection,
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                setProdukId(record.id);
              },
            };
          }}
          rowKey={(item) => item.id}
          size="small"
          rootClassName={`rounded-md ${inria.className} `}
          columns={columns}
          rowClassName={`${inria.className} cursor-pointer`}
          dataSource={data || []}
        />
      )}
    </DashboardLayout>
  );
}
