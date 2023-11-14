import { Button, Form, Input, notification } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Inria_Sans } from "next/font/google";
import useMutation from "@/hooks/useMutation";
import { useRouter } from "next/router";
import { LoginRequest, LoginResponse } from "@/types/login.type";
import Cookies from "js-cookie";
import Head from "next/head";

const inria = Inria_Sans({ subsets: ["latin"], weight: ["300", "400", "700"] });

export default function Login() {
  const router = useRouter();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();

  const [login, { loading }] = useMutation<LoginRequest, LoginResponse>("/api/admin/login", "post", {
    onSuccess: (data) => {
      api.success({
        message: "Login Berhasil",
        description: "Mengarahkan ke halaman dashboard",
        placement: "topRight",
      });

      const timeout = setTimeout(() => {
        Cookies.set("jwt", data.data?.jwt);
        router.push("/dashboard");
      }, 1000);

      return () => clearTimeout(timeout);
    },
  });

  const handleLogin = async (values: any) => {
    try {
      login(values).catch((error: any) => {
        api.error({
          message: "Login Gagal",
          description: error?.response?.data?.message || "Terjadi kesalahan saat login",
          placement: "topRight",
        });
      });
    } catch (error: any) {
      api.error({
        message: "Login Gagal",
        description: error?.response?.data?.message || "Terjadi kesalahan saat login",
        placement: "topRight",
      });
    }
  };

  return (
    <>
      <Head>
        <title>Login | Giri Palma</title>
      </Head>
      <main className={`flex items-center h-screen relative w-full ${inria.className}`}>
        {contextHolder}
        <div className="max-w-md w-full mx-auto flex flex-col rounded-lg border border-gray-200 shadow-md px-6 py-4">
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="font-bold text-lg text-secondary">Giri Palma</p>
            <img src="/images/logo.png" className="w-20 h-20" />
            <p className="font-bold text-lg text-secondary">Admin Dashboard</p>
          </div>
          <Form form={form} onFinish={handleLogin} layout="vertical" className="mt-4">
            <Form.Item
              label="Email"
              rules={[
                {
                  required: true,
                  message: "Please input your email!",
                },
              ]}
              name="email"
            >
              <Input prefix={<UserOutlined className="mr-1" />} />
            </Form.Item>
            <Form.Item
              label="Password"
              rules={[
                {
                  required: true,
                  message: "Please input your password!",
                },
              ]}
              name="password"
            >
              <Input.Password prefix={<LockOutlined className="mr-1" />} />
            </Form.Item>

            <Button loading={loading} disabled={loading} type="primary" htmlType="submit" className="w-full">
              Login
            </Button>
          </Form>
        </div>
      </main>
    </>
  );
}
