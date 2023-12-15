import { getData } from "@/lib/fetcher/getData";
import { Role } from "@/types/login.type";
import { Lokasi } from "@/types/user.type";
import { NotificationInstance } from "antd/es/notification/interface";
import React, { useEffect } from "react";
import Cookies from "js-cookie";
import DashboardLayout from "@/layout/dashboard.layout";
import fetcher from "@/lib/axios";
import { Button, DatePicker, Form, Input, Select } from "antd";
import { parseToOption } from "@/lib/helpers/parseToOption";
import useMutation from "@/hooks/useMutation";
import { useRouter } from "next/router";

export async function getServerSideProps(ctx: any) {
  const jwt = ctx.req.headers.cookie?.split("jwt=")?.[1];
  const roles = await getData<Role[]>("role", jwt || "");
  const lokasi = await getData<Lokasi[]>("lokasi-produk", jwt || "");

  return {
    props: {
      roles,
      lokasi,
    },
  };
}

type Props = {
  notificationApi: NotificationInstance;
  roles: Role[];
  lokasi: Lokasi[];
};

export default function TambahPengguna({ lokasi, notificationApi, roles }: Props) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [create, { loading }] = useMutation("/api/admin/user", "post", {
    onSuccess: () => {
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil menambahkan pengguna",
        placement: "topRight",
      });
      form.resetFields();

      setTimeout(() => {
        router.push("/dashboard/pengguna");
      }, 500);
    },
  });

  const fetchLatestKode = async () => {
    const jwt = Cookies.get("jwt");
    const response = await fetcher.get("/api/admin/user", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const data = response.data?.data;

    if (data) {
      const kodeNumber = data.length + 1;
      const kode = `SDM${kodeNumber.toString().padStart(3, "0")}`;
      form.setFieldValue("kode", kode);
    }
  };

  useEffect(() => {
    fetchLatestKode();
  }, []);

  const handleSubmit = async (values: any) => {
    values.tanggal_lahir = values.tanggal_lahir?.toISOString();

    create(values).catch((err) => {
      notificationApi.error({
        message: "Gagal",
        description: err?.response?.data?.message || "Gagal menambahkan pengguna",
        placement: "topRight",
      });
    });
  };

  return (
    <DashboardLayout title="Tambah Pengguna">
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Form.Item label="Username" name="username" rules={[{ required: true, message: "Username harus diisi" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Password harus diisi" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Kode" name="kode" rules={[{ required: true, message: "Kode harus diisi" }]}>
            <Input readOnly />
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Form.Item label="Nama" name="nama" rules={[{ required: true, message: "Nama harus diisi" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Email harus diisi" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="No. HP" name="phone" rules={[{ required: true, message: "No. HP harus diisi" }]}>
            <Input />
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Form.Item label="Tanggal Lahir" name="tanggal_lahir">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="Alamat" name="alamat">
            <Input />
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Form.Item label="Role" name="role_id" rules={[{ required: true, message: "Role harus diisi" }]}>
            <Select placeholder="Pilih Role" options={parseToOption(roles, "id", "nama")} />
          </Form.Item>
          <Form.Item label="Lokasi" name="lokasi_id" rules={[{ required: true, message: "Lokasi harus diisi" }]}>
            <Select placeholder="Pilih Lokasi" options={parseToOption(lokasi, "id", "nama")} />
          </Form.Item>
        </div>

        <Button loading={loading} htmlType="submit" type="primary">
          Tambah
        </Button>
      </Form>
    </DashboardLayout>
  );
}
