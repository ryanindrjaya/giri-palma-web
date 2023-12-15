import PenggunaModal from "@/components/PenggunaModal";
import SkeletonTable from "@/components/SkeletonTable";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { User } from "@/types/user.type";
import { Button, Input, Popconfirm, Table } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { GiSettingsKnobs } from "react-icons/gi";

type Props = {
  notificationApi: NotificationInstance;
};

export default function Pengguna({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<User[]>([]);
  const { data, loading, refetch } = useQuery<User[]>("/api/admin/user");
  const [deletePengguna, { loading: loadingDelete }] = useMutation("/api/admin/user", "delete");
  const [pengguna, setPengguna] = useState<User | null>(null);

  useEffect(() => {
    if (debouncedSearchVal) {
      refetch({ nama: debouncedSearchVal });
    } else {
      refetch();
    }
  }, [debouncedSearchVal]);

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: User[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deletePengguna(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus pengguna",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus pengguna",
        placement: "topRight",
      });
    }
  };

  const columns: ColumnsType<User> = [
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
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Kode",
      dataIndex: "kode",
      key: "email",
    },
    {
      title: "No. HP",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Role",
      dataIndex: ["role", "nama"],
      key: "role",
    },
    {
      title: "Lokasi",
      dataIndex: ["lokasi", "nama"],
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

  return (
    <DashboardLayout
      title="Pengguna"
      header={
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-2">
            <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari pengguna" />
            <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
              <GiSettingsKnobs size={18} />
            </Button>
            <Popconfirm
              title="Hapus pengguna"
              okButtonProps={{ danger: true, loading: loadingDelete }}
              description="Apakah anda yakin ingin menghapus pengguna yang dipilih?"
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
            onClick={() => router.push("/dashboard/pengguna/tambah")}
            type="primary"
            className="flex gap-2 items-center"
          >
            <div className="flex items-center gap-2">
              <AiOutlinePlus size={18} />
              <span>Tambah Pengguna</span>
            </div>
          </Button>
        </div>
      }
    >
      <PenggunaModal refetch={refetch} open={!!pengguna} onClose={() => setPengguna(null)} pengguna={pengguna} />
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
                setPengguna(record);
              },
            };
          }}
          rowKey={(item) => item.id}
          size="small"
          rootClassName={`rounded-md  `}
          rowClassName={` cursor-pointer`}
          columns={columns}
          dataSource={data || []}
        />
      )}
    </DashboardLayout>
  );
}
