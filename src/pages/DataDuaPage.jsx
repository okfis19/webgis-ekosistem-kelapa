import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "../components/Navbar";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

/* =========================================================
   KONFIGURASI GEOSERVER
   HARUS SAMA DENGAN MapPage.jsx
   ========================================================= */

const GEOSERVER_WFS_URL = "/geoserver/risetids/ows";

/* =========================================================
   NAMA LAYER
   HARUS SAMA DENGAN GeoServer
   ========================================================= */

const WFS_LAYER_KEBUN = "risetids:Infrastruktur_Data_Spasial";
const WFS_LAYER_PARIT = "risetids:Parit_Tanggul";

/* =========================================================
   DATA PAGE
   ========================================================= */

const DataDuaPage = () => {
  const [activeTab, setActiveTab] = useState("kebun");

  const [data, setData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  const [sorting, setSorting] = useState([]);

  const [globalFilter, setGlobalFilter] = useState("");

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  /* =======================================================
     KOLOM DATA KEBUN
     ======================================================= */

  const columnsKebun = useMemo(
    () => [
      {
        header: "No",
        id: "index",
        enableSorting: false,
        cell: (info) =>
          info.row.index +
          1 +
          pagination.pageIndex * pagination.pageSize,
      },

      {
        header: "Kecamatan",
        accessorKey: "Kecamatan",
      },

      {
        header: "Desa",
        accessorKey: "Desa",
      },

      {
        header: "Nama Pemilik",
        accessorKey: "Nama Pemilik",
      },

      {
        header: "Luas Lahan (Ha)",
        accessorKey: "Luas Lahan (Ha)",
      },

      {
        header: "Jumlah Pohon",
        accessorKey: "Jumlah Pohon",
      },

      {
        header: "Pola Budidaya",
        accessorKey: "Pola Budidaya",
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  /* =======================================================
     KOLOM DATA PARIT
     ======================================================= */

  const columnsParit = useMemo(
    () => [
      {
        header: "No",
        id: "index",
        enableSorting: false,
        cell: (info) =>
          info.row.index +
          1 +
          pagination.pageIndex * pagination.pageSize,
      },

      {
        header: "Wilayah",
        accessorKey: "Wilayah",
      },

      {
        header: "Status Parit",
        accessorKey: "Status Parit",
      },

      {
        header: "Nama Parit/Tanggul",
        accessorKey: "Nama",
      },

      {
        header: "Desa",
        accessorKey: "Desa",
      },

      {
        header: "Kecamatan",
        accessorKey: "Kecamatan",
      },

      {
        header: "Panjang (km)",
        accessorKey: "Panjang Parit/Tanggul (km)",
      },

      {
        header: "Lebar (m)",
        accessorKey: "Lebar Parit/Tanggul (m)",
      },

      {
        header: "Permasalahan",
        accessorKey: "Permasalahan",
      },

      {
        header: "Realisasi",
        accessorKey: "Realisasi",
      },

      {
        header: "Tahun Perbaikan",
        accessorKey: "Tahun Perbaikan",
      },

      {
        header: "Pendanaan",
        accessorKey: "Pendanaan",
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  /* =======================================================
     PILIH KOLOM SESUAI TAB
     ======================================================= */

  const currentColumns =
    activeTab === "kebun"
      ? columnsKebun
      : columnsParit;

  /* =======================================================
     TANSTACK TABLE
     ======================================================= */

  const table = useReactTable({
    data,
    columns: currentColumns,

    getCoreRowModel: getCoreRowModel(),

    getSortedRowModel: getSortedRowModel(),

    getFilteredRowModel: getFilteredRowModel(),

    getPaginationRowModel: getPaginationRowModel(),

    state: {
      sorting,
      globalFilter,
      pagination,
    },

    onSortingChange: setSorting,

    onGlobalFilterChange: setGlobalFilter,

    onPaginationChange: setPagination,

    autoResetPageIndex: false,
  });

  /* =======================================================
     AMBIL DATA WFS
     ======================================================= */

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      setData([]);

      /*
        Set kembali ke halaman pertama
        setiap kali tab berubah.
      */
      setPagination((previous) => ({
        ...previous,
        pageIndex: 0,
      }));

      try {
        const layerName =
          activeTab === "kebun"
            ? WFS_LAYER_KEBUN
            : WFS_LAYER_PARIT;

        const params = new URLSearchParams({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: layerName,
          outputFormat: "application/json",
        });

        const url =
          `${GEOSERVER_WFS_URL}?${params.toString()}`;

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) {
          throw new Error(
            `GeoServer mengembalikan HTTP ${response.status}`
          );
        }

        const result = await response.json();

        if (
          !result ||
          !Array.isArray(result.features)
        ) {
          throw new Error(
            "Respons GeoServer bukan GeoJSON FeatureCollection."
          );
        }

        /*
          Ambil properties dari setiap feature.
        */

        const formattedData = result.features.map(
          (feature) => feature.properties || {}
        );

        setData(formattedData);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "Gagal menarik data dari GeoServer:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil data dari GeoServer."
        );

        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [activeTab]);

  /* =======================================================
     GANTI TAB
     ======================================================= */

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    setGlobalFilter("");

    setSorting([]);

    setPagination((previous) => ({
      ...previous,
      pageIndex: 0,
    }));
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="min-h-screen bg-[#f0f2f5] pt-28 px-8 pb-8 font-sans">
      <Navbar />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[85vh] flex flex-col">

        {/* =================================================
            TAB
            ================================================= */}

        <div className="flex justify-between items-center border-b border-gray-200 mb-6 pb-2">

          <div className="flex gap-8">

            {/* TAB KEBUN */}

            <button
              onClick={() =>
                handleTabChange("kebun")
              }
              className={`
                pb-3
                text-sm
                font-bold
                transition-colors
                relative

                ${
                  activeTab === "kebun"
                    ? "text-[#1268A8]"
                    : "text-gray-400 hover:text-gray-600"
                }
              `}
            >
              Data Kebun Petani

              {activeTab === "kebun" && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#1268A8] rounded-t-md" />
              )}
            </button>

            {/* TAB PARIT */}

            <button
              onClick={() =>
                handleTabChange("parit")
              }
              className={`
                pb-3
                text-sm
                font-bold
                transition-colors
                relative

                ${
                  activeTab === "parit"
                    ? "text-[#1268A8]"
                    : "text-gray-400 hover:text-gray-600"
                }
              `}
            >
              Data Parit dan Tanggul

              {activeTab === "parit" && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#1268A8] rounded-t-md" />
              )}
            </button>

          </div>

          {/* =================================================
              SEARCH
              ================================================= */}

          <div className="relative mb-2">

            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) =>
                setGlobalFilter(e.target.value)
              }
              placeholder="Cari data..."
              className="
                pl-10
                pr-4
                py-2
                border
                border-gray-200
                rounded-lg
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-[#1268a8]/50
                transition-all
                w-64
              "
            />

            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

          </div>

        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            <strong>Gagal memuat data:</strong>{" "}
            {error}
          </div>
        )}

        {/* =================================================
            TABEL
            ================================================= */}

        <div className="flex-1 mt-4 overflow-auto min-h-0">

          {isLoading ? (

            <div className="flex justify-center items-center h-64 text-gray-400 font-bold">
              Memuat data dari GeoServer...
            </div>

          ) : (

            <table className="w-full min-w-max text-left text-sm text-gray-500 border-separate border-spacing-0">

              {/* HEADER */}

              <thead className="font-semibold text-gray-600 sticky top-0 z-10 bg-white">

                {table.getHeaderGroups().map(
                  (headerGroup) => (

                    <tr key={headerGroup.id}>

                      {headerGroup.headers.map(
                        (header, index) => {

                          const isFirst =
                            index === 0;

                          const isLast =
                            index ===
                            headerGroup.headers.length -
                              1;

                          const canSort =
                            header.column.getCanSort();

                          return (
                            <th
                              key={header.id}
                              className={`
                                px-6
                                py-4
                                bg-[#F0F2F5]
                                whitespace-nowrap
                                select-none

                                ${
                                  canSort
                                    ? "cursor-pointer hover:bg-[#e4e7eb]"
                                    : ""
                                }

                                transition-colors

                                ${
                                  isFirst
                                    ? "rounded-l-full"
                                    : ""
                                }

                                ${
                                  isLast
                                    ? "rounded-r-full"
                                    : ""
                                }
                              `}
                              onClick={
                                canSort
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                            >

                              <div className="flex items-center gap-2">

                                {flexRender(
                                  header.column.columnDef
                                    .header,
                                  header.getContext()
                                )}

                                {header.column.getIsSorted() ===
                                  "asc" && (
                                  <span className="text-[#1268a8]">
                                    ▲
                                  </span>
                                )}

                                {header.column.getIsSorted() ===
                                  "desc" && (
                                  <span className="text-[#1268a8]">
                                    ▼
                                  </span>
                                )}

                              </div>

                            </th>
                          );
                        }
                      )}

                    </tr>
                  )
                )}

              </thead>

              {/* BODY */}

              <tbody className="bg-white">

                <tr>
                  <td
                    colSpan={currentColumns.length}
                    className="h-2"
                  />
                </tr>

                {table.getRowModel().rows.map(
                  (row) => (

                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >

                      {row.getVisibleCells().map(
                        (cell) => (

                          <td
                            key={cell.id}
                            className="px-6 py-4 border-b border-gray-100 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>

                        )
                      )}

                    </tr>

                  )
                )}

                {/* DATA KOSONG */}

                {data.length === 0 &&
                  !isLoading && (
                    <tr>
                      <td
                        colSpan={
                          currentColumns.length
                        }
                        className="text-center py-8 text-gray-400"
                      >
                        Data tidak ditemukan di server.
                      </td>
                    </tr>
                  )}

              </tbody>

            </table>

          )}

        </div>

        {/* =================================================
            PAGINATION
            ================================================= */}

        {!isLoading && data.length > 0 && (

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 shrink-0">

            <span className="text-sm text-gray-500 font-medium">

              Menampilkan{" "}
              {table.getRowModel().rows.length}{" "}
              dari{" "}
              {table.getFilteredRowModel().rows.length}{" "}
              data

            </span>

            <div className="flex items-center gap-2">

              {/* PREVIOUS */}

              <button
                onClick={() =>
                  table.previousPage()
                }
                disabled={
                  !table.getCanPreviousPage()
                }
                className="
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-gray-200
                  text-gray-500
                  hover:bg-gray-50
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-all
                "
              >
                ‹
              </button>

              {/* PAGE */}

              <span className="text-sm font-bold text-[#1258a8] px-3">
                Halaman{" "}
                {table.getState().pagination.pageIndex +
                  1}{" "}
                /{" "}
                {Math.max(
                  table.getPageCount(),
                  1
                )}
              </span>

              {/* NEXT */}

              <button
                onClick={() =>
                  table.nextPage()
                }
                disabled={
                  !table.getCanNextPage()
                }
                className="
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-gray-200
                  text-gray-500
                  hover:bg-gray-50
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-all
                "
              >
                ›
              </button>

            </div>

          </div>

        )}

      </div>
    </div>
  );
};

export default DataDuaPage;