import useQuery from "@/hooks/useQuery";
import { Pelanggan } from "@/types/pelanggan.type";
import { Descriptions, DescriptionsProps, Image, Input, Modal, Select } from "antd";
import React, { useEffect, useMemo } from "react";
import { MdOutlineOpenInNew } from "react-icons/md";
import SkeletonTable from "./SkeletonTable";
import { User } from "@/types/user.type";
import { LokasiProduk } from "@/types/produk.type";
import useMutation from "@/hooks/useMutation";
import { Role } from "@/types/login.type";
import _ from "lodash";
import { parseToOption } from "@/lib/helpers/parseToOption";

type Props = {
  pengguna: User | null;
  open: boolean;
  onClose: () => void;
  refetch?: () => void;
};

export default function PenggunaModal({ refetch, open, pengguna, onClose }: Props) {
  if (!pengguna) return null;

  const {
    data: lokasi,
    loading: loadingLokasi,
    refetch: refetchLokasi,
  } = useQuery<LokasiProduk[]>("/api/admin/lokasi-produk", {
    trigger: open,
  });
  const {
    data: role,
    loading: loadingRole,
    refetch: refetchRole,
  } = useQuery<Role[]>("/api/admin/role", {
    trigger: open,
  });
  const [edit] = useMutation(`/api/admin/user/${pengguna.id}`, "put", {
    onSuccess: () => {
      if (refetch) refetch();
    },
  });

  useEffect(() => {
    if (open) {
      refetchLokasi();
      refetchRole();
    }
  }, [open]);

  const dataPelanggan: DescriptionsProps["items"] = useMemo(
    () => [
      {
        key: "1",
        label: "Nama",
        span: 2,
        children: (
          <Input
            defaultValue={pengguna?.nama}
            onChange={_.debounce((e) => {
              edit({ nama: e.target.value });
            })}
          />
        ),
      },
      {
        key: "2",
        label: "Username",
        span: 2,
        children: (
          <Input
            defaultValue={pengguna?.username}
            onChange={_.debounce((e) => {
              edit({ username: e.target.value });
            })}
          />
        ),
      },
      {
        key: "4",
        label: "Kode",
        span: 2,
        children: pengguna?.kode,
      },
      {
        key: "3",
        label: "Lokasi",
        children: (
          <Select
            defaultValue={pengguna?.lokasi?.id}
            onChange={(value) => {
              edit({ lokasi_id: value });
            }}
            options={parseToOption(lokasi || [], "id", "nama")}
            style={{ width: "100%" }}
          />
        ),
      },
      {
        key: "5",
        label: "Role",
        children: (
          <Select
            defaultValue={pengguna?.role?.id}
            onChange={(value) => {
              edit({ role_id: value });
            }}
            options={parseToOption(role || [], "id", "nama")}
            style={{ width: "100%" }}
          />
        ),
      },
      {
        key: "6",
        label: "No. HP",
        children: (
          <Input
            defaultValue={pengguna?.phone}
            onChange={_.debounce((e) => {
              edit({ phone: e.target.value });
            })}
          />
        ),
      },
      {
        key: "7",
        label: "Email",
        children: (
          <Input
            defaultValue={pengguna?.email}
            onChange={_.debounce((e) => {
              edit({ email: e.target.value });
            })}
          />
        ),
        span: 2,
      },
      {
        key: "8",
        label: "Alamat",
        children: (
          <Input
            defaultValue={pengguna?.alamat}
            onChange={_.debounce((e) => {
              edit({ alamat: e.target.value });
            })}
          />
        ),
        span: 2,
      },
    ],
    [pengguna, role, lokasi]
  );

  return (
    <Modal
      okButtonProps={{ hidden: true, style: { display: "none" } }}
      cancelText="Tutup"
      title="Pengguna Detail"
      width={1000}
      open={open}
      onOk={onClose}
      onCancel={onClose}
    >
      {loadingLokasi || loadingRole ? (
        <SkeletonTable />
      ) : (
        <div className="flex flex-col gap-4">
          <Descriptions bordered size="small" column={2} title="Data Pengguna" items={dataPelanggan} />
        </div>
      )}
    </Modal>
  );
}
