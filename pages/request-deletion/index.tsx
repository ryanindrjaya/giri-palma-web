import useMutation from '@/hooks/useMutation';
import { LoginRequest, LoginResponse } from '@/types/login.type';
import { LockOutlined, MailOutlined, RedEnvelopeOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, notification } from 'antd'
import Head from 'next/head';
import React from 'react'

function UserDeletion() {
    const [form] = Form.useForm();
    const [api, contextHolder] = notification.useNotification();

    const [requestDelete, { loading }] = useMutation<LoginRequest, LoginResponse>("/api/user/deletion", "post", {
        onSuccess: () => {
            api.success({
                message: "Request Berhasil",
                description: "Request penghapusan berhasil dikirimkan",
                placement: "topRight",
            });
            form.resetFields();


            return () => clearTimeout(1000);
        },
    });

    const handleRequest = async (values: any) => {
        try {
            requestDelete(values).catch((error: any) => {
                api.error({
                    message: "Request Gagal",
                    description: error?.response?.data?.message || "Terjadi kesalahan saat request",
                    placement: "topRight",
                });
            });
        } catch (error: any) {
            api.error({
                message: "Request Gagal",
                description: error?.response?.data?.message || "Terjadi kesalahan saat request",
                placement: "topRight",
            });
        }
    };

    return (
        <>
            <Head>
                <title>Request Hapus Akun | Blikasur</title>
            </Head>
            <div className='flex justify-center align-middle items-center min-h-screen'>
                <Card
                    title="Hapus akun"
                    style={{ width: 500 }}>
                    <Form form={form} onFinish={handleRequest} layout="vertical" className="mt-4">
                        <Form.Item
                            label="Username"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input your username!",
                                },
                            ]}
                            name="username"

                        >
                            <Input placeholder='jhondoe' prefix={<UserOutlined className="mr-1" />} />
                        </Form.Item>
                        <Form.Item
                            label="email"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input your Email!",
                                },
                            ]}
                            name="email"
                        >
                            <Input placeholder='jhondoe@gmail.com' prefix={<MailOutlined className="mr-1" />} />
                        </Form.Item>
                        <Form.Item
                            label="Alasan"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input your password!",
                                },
                            ]}
                            name="reason"
                        >
                            <Input.TextArea placeholder='Ketikan alasan disini..' />
                        </Form.Item>

                        <Button
                            size="large"
                            loading={loading}
                            disabled={loading}
                            type="primary"
                            htmlType="submit"
                            className="w-full mb-10"
                        >
                            Kirimkan
                        </Button>
                    </Form>
                    <Card.Meta className='mt-10' title="Catatan" description="Request penghapusan akun akan menunggu persetujuan admin. Jika sudah berhasil, maka akun yang sudah dihapus tidak dapat digunakan kembali" />
                </Card>
            </div>


        </>


    )
}

export default UserDeletion
