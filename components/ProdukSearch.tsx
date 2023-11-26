import useDebounce from "@/hooks/useDebounce";
import useQuery from "@/hooks/useQuery";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { Produk } from "@/types/produk.type";
import { SearchOutlined } from "@ant-design/icons";
import { Select } from "antd";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import fetcher from "@/lib/axios";

type Props = {
  onSelect: (value: Produk) => void;
};

export default function ProdukSearch({ onSelect }: Props) {
  const [search, setSearch] = useState<string>("");
  const debounced = useDebounce(search, 500);
  const [selected, setSelected] = useState<string | null>();

  const { data, loading, refetch } = useQuery<Produk[]>("/api/admin/produk");

  useEffect(() => {
    refetch({ nama: debounced });
  }, [debounced]);

  const getProduk = async (id: string) => {
    try {
      const jwt = Cookies.get("jwt");

      const res = await fetcher.get(`/api/admin/produk/${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      onSelect(res.data.data as Produk);
      setSelected(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Select
      onSearch={(e) => {
        setSearch(e);
      }}
      value={selected}
      allowClear
      onSelect={(e) => {
        setSelected(e);
        getProduk(e);
      }}
      suffixIcon={<SearchOutlined />}
      showSearch
      className="w-full"
      filterOption={false}
      placeholder="CARI KODE ATAU NAMA PRODUK"
      loading={loading}
      options={parseToOption(data || [], "id", "nama")}
    />
  );
}
