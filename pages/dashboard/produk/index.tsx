"use client";

import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import {
  Button,
  Input,
  InputNumber,
  Popconfirm,
  Switch,
  Table,
  Tabs,
  TabsProps,
  Tag,
  Tooltip,
  notification,
} from "antd";
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
import { PoweroffOutlined } from "@ant-design/icons";

type Props = {
  notificationApi: NotificationInstance;
};

export default function Produk({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<Produk[]>([]);
  const { data, loading, refetch } = useQuery<Produk[]>("/api/admin/produk");
  const [tab, setTab] = useState<string>("1");
  const {
    data: dataNonAktif,
    loading: loadingNonAktif,
    refetch: refetchNonAktif,
  } = useQuery<Produk[]>("/api/admin/produk/non-active");
  const [deleteProduk, { loading: loadingDelete }] = useMutation("/api/admin/produk", "delete");
  const [deactiveProduk, { loading: loadingDeactive }] = useMutation("/api/admin/produk/inactive", "post");
  const [activateProduk, { loading: loadingActivate }] = useMutation("/api/admin/produk/reactive", "post");
  const [editProduk, { loading: loadingEdit }] = useMutation("/api/admin/produk", "put");

  const [produkId, setProdukId] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedSearchVal) {
      refetch({ nama: debouncedSearchVal });
      refetchNonAktif({ nama: debouncedSearchVal });
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
      align: "center",
      render: (_v, item) => {
        const kategori = item?.kategori_produk?.nama || "-";

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
      title: "Action",
      align: "center",
      render: (_, item) => (
        <div className="flex justify-center items-center gap-2">
          <Tooltip title="Edit produk">
            <Button type="primary" className="flex p-1 justify-center items-center">
              <AiOutlineEdit size={18} />
            </Button>
          </Tooltip>
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
      refetchNonAktif();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus produk",
        placement: "topRight",
      });
    }
  };
  const handleBulkDeactive = async () => {
    try {
      const promises = selectedRow.map((item) => deactiveProduk(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menonaktifkan produk",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
      refetchNonAktif();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menonaktifkan produk",
        placement: "topRight",
      });
    }
  };
  const handleBulkActivate = async () => {
    try {
      const promises = selectedRow.map((item) => activateProduk(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil mengaktifkan produk",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
      refetchNonAktif();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal mengaktifkan produk",
        placement: "topRight",
      });
    }
  };

  useEffect(() => {
    if (router.query?.id) {
      setProdukId(router.query.id as string);
    }
  }, [router.query]);

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Produk Aktif",
      children: (
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
      ),
    },
    {
      key: "2",
      label: "Produk Non-Aktif",
      children: (
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
          dataSource={dataNonAktif || []}
        />
      ),
    },
  ];

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
            {/* <Popconfirm
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
            </Popconfirm> */}
            {tab === "1" ? (
              <Popconfirm
                title="Non-Aktifkan produk"
                okButtonProps={{ danger: true, loading: loadingDeactive }}
                description="Apakah anda yakin ingin menonaktifkan produk yang dipilih?"
                onConfirm={handleBulkDeactive}
              >
                <Button
                  danger
                  loading={loadingDelete}
                  disabled={loadingDelete}
                  className={`px-2 flex items-center border border-gray-400 transition-opacity duration-100 rounded-md bg-white cursor-pointer  ${
                    selectedRow.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  } `}
                >
                  <PoweroffOutlined size={18} />
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="Aktifkan produk"
                okButtonProps={{ loading: loadingActivate }}
                description="Apakah anda yakin ingin mengaktifkan produk yang dipilih?"
                onConfirm={handleBulkActivate}
              >
                <Button
                  loading={loadingDelete}
                  disabled={loadingDelete}
                  className={`px-2 flex items-center border border-gray-400 transition-opacity duration-100 rounded-md bg-white cursor-pointer  ${
                    selectedRow.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  } `}
                >
                  <PoweroffOutlined size={18} />
                </Button>
              </Popconfirm>
            )}
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
      {loading || loadingNonAktif ? (
        <SkeletonTable />
      ) : (
        <Tabs activeKey={tab} items={tabItems} onChange={(key) => setTab(key)} />
      )}
    </DashboardLayout>
  );
}
