import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  ZoomControl,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Navbar from "../components/Navbar";
import LayerPanel from "../components/LayerPanel";
import LegendPanel from "../components/LegendPanel";

// Gunakan endpoint umum agar layer dari workspace risetids maupun risetdids
// dapat dipanggil. Jika aplikasi memakai proxy, sesuaikan alamat di bawah.
export const GEOSERVER_WMS_URL = "/geoserver/wms";
export const GEOSERVER_WFS_URL = "/geoserver/ows";

export const LAYER_CONFIG = [
  {
    id: "layerAdm",
    name: "Batas Administrasi Kecamatan",
    wsName: "risetids:Batas_Administrasi_Kecamatan-LN",
  },
  {
    id: "layerAdmDesa",
    name: "Batas Administrasi Desa",
    wsName: "risetids:Batas Administrasi Desa-LN",
  },
  {
    id: "layerKab",
    name: "Kabupaten Indragiri Hilir",
    wsName: "risetdids:Kab.Indragiri_Hilir-2",
  },
  {
    id: "layerSungai",
    name: "Sungai Indragiri Hilir",
    wsName: "risetids:Sungai_Indragiri_Hilir",
  },
  {
    id: "layerTanah",
    name: "Jenis Tanah",
    wsName: "risetids:Jenis_Tanah_INHIL",
  },
  {
    id: "layerKelapa",
    name: "Sebaran Perkebunan Kelapa",
    wsName: "risetids:Sebaran_Kebun_Kelapa",
  },
  {
    id: "layerDem",
    name: "Demnas",
    wsName: "risetids:Demnas_Clip-2",
  },
  {
    id: "layerLahan",
    name: "Tutupan Lahan",
    wsName: "risetids:Tutupan_Lahan",
  },
  {
    id: "layerParit",
    name: "Parit dan Tanggul",
    wsName: "risetids:Parit_Tanggul",
  },
  {
    id: "layerPolaRuang",
    name: "Rencana Pola Ruang",
    wsName: "risetids:Rencana Pola Ruang",
  },
];

const MIN_ZOOM_NOMOR = 13;

const createNomorIcon = (nomor) =>
  L.divIcon({
    className: "nomor-parit-wrapper",
    html: `<div class="nomor-parit">${nomor}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

// Mendapatkan titik tengah perkiraan berdasarkan vertex tengah garis.
// GeoJSON menggunakan urutan koordinat [longitude, latitude].
const getTitikTengah = (geometry) => {
  if (!geometry?.coordinates) return null;

  let garis;
  if (geometry.type === "LineString") {
    garis = geometry.coordinates;
  } else if (geometry.type === "MultiLineString") {
    garis = geometry.coordinates.reduce(
      (terpanjang, current) =>
        current.length > terpanjang.length ? current : terpanjang,
      []
    );
  } else {
    return null;
  }

  if (!Array.isArray(garis) || garis.length === 0) return null;

  const titik = garis[Math.floor(garis.length / 2)];
  if (
    !Array.isArray(titik) ||
    titik.length < 2 ||
    !Number.isFinite(Number(titik[0])) ||
    !Number.isFinite(Number(titik[1]))
  ) {
    return null;
  }

  return [Number(titik[1]), Number(titik[0])];
};

const ZoomTracker = ({ setZoom }) => {
  useMapEvents({
    zoomend: (event) => setZoom(event.target.getZoom()),
  });
  return null;
};

const NomorParitTanggul = ({ features, visible }) => {
  if (!visible) return null;

  return (
    <>
      {features.map((feature, index) => {
        const nama = feature?.properties?.Nama;
        const posisi = getTitikTengah(feature?.geometry);

        if (!nama || !posisi) return null;

        const nomor = index + 1;
        const markerKey =
          feature.id ?? `${String(nama)}-${posisi[0]}-${posisi[1]}-${index}`;

        return (
          <Marker
            key={markerKey}
            position={posisi}
            icon={createNomorIcon(nomor)}
          >
            <Popup>
              <div className="popup-nama-parit">{nama}</div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

const ParitTanggulData = ({ enabled, zoom }) => {
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setFeatures([]);
      setError("");
      return undefined;
    }

    const controller = new AbortController();

    const params = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "risetids:Parit_Tanggul",
      outputFormat: "application/json",
    });

    const url = `${GEOSERVER_WFS_URL}?${params.toString()}`;

    const loadFeatures = async () => {
      try {
        setError("");
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(
            `GeoServer WFS mengembalikan HTTP ${response.status}`
          );
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.features)) {
          throw new Error(
            "Respons WFS bukan GeoJSON FeatureCollection yang valid."
          );
        }

        setFeatures(data.features);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error mengambil data WFS Parit/Tanggul:", err);
          setError(err.message || "Gagal mengambil data Parit dan Tanggul.");
          setFeatures([]);
        }
      }
    };

    loadFeatures();

    return () => controller.abort();
  }, [enabled]);

  return (
    <>
      <NomorParitTanggul
        features={features}
        visible={enabled && zoom >= MIN_ZOOM_NOMOR}
      />
      {error && console.warn("WFS Parit/Tanggul:", error)}
    </>
  );
};

const MapPage = () => {
  const [activeLayers, setActiveLayers] = useState({
    layerKab: false,
    layerAdm: false,
    layerAdmDesa: false,
    layerSungai: false,
    layerTanah: false,
    layerKelapa: false,
    layerDem: false,
    layerLahan: false,
    layerParit: false,
    layerPolaRuang: false,
  });

  const [zoom, setZoom] = useState(8);

  const handleToggleLayer = (layerId) => {
    setActiveLayers((previous) => ({
      ...previous,
      [layerId]: !previous[layerId],
    }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Navbar />

      <div className="pointer-events-none absolute bottom-8 right-8 top-24 z-[1000] flex flex-col items-end justify-between">
        <div className="pointer-events-auto">
          <LayerPanel
            activeLayers={activeLayers}
            onToggle={handleToggleLayer}
          />
        </div>

        <div className="pointer-events-auto">
          <LegendPanel activeLayers={activeLayers} />
        </div>
      </div>

      <div className="absolute inset-0 z-10 h-full w-full">
        <MapContainer
          center={[-0.4, 103.2]}
          zoom={8}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />

          {LAYER_CONFIG.map(
            (layer) =>
              activeLayers[layer.id] && (
                <WMSTileLayer
                  key={layer.id}
                  url={GEOSERVER_WMS_URL}
                  layers={layer.wsName}
                  format="image/png"
                  transparent
                  version="1.1.1"
                />
              )
          )}

          <ZoomTracker setZoom={setZoom} />

          <ParitTanggulData
            enabled={activeLayers.layerParit}
            zoom={zoom}
          />

          <ZoomControl position="bottomleft" />
        </MapContainer>
      </div>

      <style>{`
        .nomor-parit-wrapper {
          background: transparent;
          border: none;
        }

        .nomor-parit {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 2px solid #0077b6;
          border-radius: 50%;
          color: #0077b6;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .nomor-parit:hover {
          background: #0077b6;
          color: #ffffff;
          transform: scale(1.2);
        }

        .popup-nama-parit {
          min-width: 100px;
          padding: 5px 8px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          color: #263238;
        }
      `}</style>
    </div>
  );
};

export default MapPage;