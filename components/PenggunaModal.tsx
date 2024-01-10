import useQuery from "@/hooks/useQuery";
import { Pelanggan } from "@/types/pelanggan.type";
import { Button, Descriptions, DescriptionsProps, Drawer, Form, Image, Input, Modal, Select, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  const [show, setShow] = useState<string>("deskripsi");
  const [form] = Form.useForm();

  const [changePassword, { loading: loadingChangePassword }] = useMutation(
    `/api/admin/user/change-password-admin`,
    "post",
    {
      onSuccess: () => {
        message.success("Berhasil mengubah password");
        setShow("deskripsi");
        form.resetFields();
      },
    }
  );

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
            }, 1000)}
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
            }, 1000)}
          />
        ),
      },
      {
        key: "4",
        label: "Kode",
        span: 2,
        children: (
          <Input
            defaultValue={pengguna?.kode}
            onChange={_.debounce((e) => {
              edit({ kode: e.target.value });
            }, 1000)}
          />
        ),
      },
      {
        key: "3",
        label: "Lokasi",
        children: (
          <Select
            suffixIcon={null}
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
            suffixIcon={null}
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
            }, 1000)}
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
            }, 1000)}
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
            }, 1000)}
          />
        ),
        span: 2,
      },
    ],
    [pengguna, role, lokasi]
  );

  const Deskripsi = () => (
    <div className="flex flex-col gap-4">
      <Descriptions bordered size="small" column={2} title="Data Pengguna" items={dataPelanggan} />

      <span
        onClick={() => setShow("change-password")}
        className="text-blue-400 self-start cursor-pointer hover:text-blue-400/75 transition-colors duration-100"
      >
        Ganti Password
      </span>
    </div>
  );

  const handleChangePassword = () => {
    const values = form.getFieldsValue();

    if (!values.new_password || !values.confirm_new_password) {
      message.error("Password tidak boleh kosong");
      return;
    }

    if (values.new_password !== values.confirm_new_password) {
      message.error("Password tidak sama");
      return;
    }

    changePassword({
      user_id: pengguna.id,
      new_password: values.new_password,
    }).catch((err) => {
      message.error(err?.response?.data?.message || "Terjadi kesalahan");
    });
  };

  const ChangePassword = () => (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-base font-bold">Ganti Password Pengguna</p>

      <Form
        form={form}
        layout="vertical"
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            handleChangePassword();
          }
        }}
        onFinish={handleChangePassword}
      >
        <Form.Item name="new_password">
          <Input.Password placeholder="Password Baru" />
        </Form.Item>

        <Form.Item name="confirm_new_password">
          <Input.Password placeholder="Konfirmasi Password Baru" />
        </Form.Item>

        <Button loading={loadingChangePassword} htmlType="submit" type="primary" block>
          Simpan
        </Button>
      </Form>

      <span
        onClick={() => setShow("deskripsi")}
        className="text-blue-400 self-start cursor-pointer hover:text-blue-400/75 transition-colors duration-100"
      >
        Kembali
      </span>
    </div>
  );

  return (
    <Modal
      okButtonProps={{
        hidden: show === "deskripsi" ? true : false,
        style: { display: show === "deskripsi" ? "none" : "unset" },
      }}
      okText="Simpan"
      cancelText="Tutup"
      title="Pengguna Detail"
      width={1000}
      open={open}
      onOk={show === "deskripsi" ? onClose : handleChangePassword}
      onCancel={onClose}
    >
      {loadingLokasi || loadingRole ? <SkeletonTable /> : <Deskripsi />}
      <Drawer open={show === "change-password"} onClose={() => setShow("deskripsi")} width={400}>
        <ChangePassword />
      </Drawer>
    </Modal>
  );
}
