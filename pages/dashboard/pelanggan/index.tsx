import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Descriptions, DescriptionsProps, Input, Popconfirm, Table, Tag, notification } from "antd";
import { GiSettingsKnobs } from "react-icons/gi";
import { AiOutlinePlus, AiOutlineEdit } from "react-icons/ai";
import React, { useState, useEffect } from "react";
import useQuery from "@/hooks/useQuery";
import SkeletonTable from "@/components/SkeletonTable";
import { Pelanggan } from "@/types/pelanggan.type";
import type { ColumnsType } from "antd/es/table";
import { BsFillTrashFill } from "react-icons/bs";
import { MdOutlineOpenInNew } from "react-icons/md";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import PelangganModal from "@/components/PelangganModal";

type Props = {};

export default function Pelanggan({}: Props) {
  const [api, contextHolder] = notification.useNotification();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<Pelanggan[]>([]);
  const { data, loading, refetch } = useQuery<Pelanggan[]>("/api/admin/pelanggan");
  const [deletePelanggan, { loading: loadingDelete }] = useMutation("/api/admin/pelanggan", "delete");

  const [pelangganId, setPelangganId] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedSearchVal) {
      refetch({ nama: debouncedSearchVal });
    } else {
      refetch();
    }
  }, [debouncedSearchVal]);

  const columns: ColumnsType<Pelanggan> = [
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
      title: "Nama Merchant",
      dataIndex: "nama_merchant",
      key: "nama_merchant",
    },
    {
      title: "Kode",
      dataIndex: "kode",
      key: "email",
    },
    {
      title: "Kategori",
      key: "kategori",
      render: (_v, item, index) => {
        const kategori = item.pelanggan_kategori.nama;

        return (
          <Tag className={inria.className} color={kategori === "Merchant" ? "geekblue-inverse" : "gold-inverse"}>
            {kategori}
          </Tag>
        );
      },
    },
    {
      title: "No. HP",
      dataIndex: "telp",
      key: "no_hp",
    },
    {
      title: "Alamat",
      dataIndex: "alamat",
      key: "alamat",
    },
    {
      title: "Sales",
      dataIndex: ["user", "nama"],
      key: "sales",
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
    onChange: (selectedRowKeys: React.Key[], selectedRows: Pelanggan[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const DetailPelanggan = ({ pelanggan }: { pelanggan: Pelanggan }) => {
    const dataPelanggan: DescriptionsProps["items"] = [
      {
        key: "1",
        label: "Nama",
        children: pelanggan.nama,
      },
      {
        key: "2",
        label: "Nama Merchant",
        children: pelanggan.nama_merchant,
      },
      {
        key: "3",
        label: "Kategori",
        children: pelanggan.pelanggan_kategori.nama,
      },
      {
        key: "4",
        label: "Kode",
        children: pelanggan.kode,
      },
      {
        key: "5",
        label: "Kategori",
        children: pelanggan.pelanggan_kategori.nama,
      },
      {
        key: "6",
        label: "No. HP",
        children: pelanggan.telp,
      },
      {
        key: "7",
        label: "Kredit Limit",
        children: pelanggan.kredit_limit,
      },
      {
        key: "8",
        label: "Tenor",
        children: pelanggan.tenor,
      },
    ];

    const dataLokasi: DescriptionsProps["items"] = [
      {
        key: "1",
        label: "Provinsi",
        children: pelanggan.provinsi,
      },
      {
        key: "2",
        label: "Kabupaten",
        children: pelanggan.kota,
      },
      {
        key: "3",
        label: "Kecamatan",
        children: pelanggan.kecamatan,
      },
      {
        key: "4",
        label: "Kelurahan",
        children: pelanggan.kelurahan,
      },
      {
        key: "5",
        label: "Alamat",
        children: pelanggan.alamat,
      },
      {
        key: "kode_pos",
        label: "Kode Pos",
        children: pelanggan.kode_pos,
      },
      {
        key: "6",
        label: "Koordinat",
        children: (
          <a
            target="_blank"
            href={`https://maps.google.com/?q=${pelanggan.latitude},${pelanggan.longitude}`}
            className="text-blue-500 hover:text-blue-300 transition-all duration-75 items-center cursor-pointer flex gap-2"
          >
            <p className="">
              {pelanggan.latitude},&nbsp;{pelanggan.longitude}
            </p>
            <MdOutlineOpenInNew size={18} />
          </a>
        ),
      },
    ];

    return (
      <div className="flex flex-col gap-3 px-3 py-2 bg-white rounded-md">
        <Descriptions bordered size="small" title="Data Pelanggan" items={dataPelanggan} />
        <Descriptions bordered size="small" title="Lokasi Pelanggan" items={dataLokasi} />
      </div>
    );
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deletePelanggan(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        api.success({
          message: "Berhasil",
          description: "Berhasil menghapus pelanggan",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      api.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus pelanggan",
        placement: "topRight",
      });
    }
  };

  return (
    <DashboardLayout
      title="Pelanggan"
      header={
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-2">
            <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari pelanggan" />
            <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
              <GiSettingsKnobs size={18} />
            </Button>
            <Popconfirm
              title="Hapus pelanggan"
              okButtonProps={{ danger: true, loading: loadingDelete }}
              description="Apakah anda yakin ingin menghapus pelanggan yang dipilih?"
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
          <Button type="primary" className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <AiOutlinePlus size={18} />
              <span>Tambah Pelanggan</span>
            </div>
          </Button>
        </div>
      }
    >
      <PelangganModal
        refetch={refetch}
        open={!!pelangganId}
        onClose={() => setPelangganId(null)}
        pelangganId={pelangganId || ""}
      />

      {contextHolder}
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
                setPelangganId(record.id);
              },
            };
          }}
          rowKey={(item) => item.id}
          size="small"
          rootClassName={`rounded-md ${inria.className} `}
          columns={columns}
          rowClassName={inria.className}
          dataSource={data || []}
        />
      )}
    </DashboardLayout>
  );
}
