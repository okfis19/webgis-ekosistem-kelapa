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

/* =========================================================
   GEOSERVER
   ========================================================= */

export const GEOSERVER_WMS_URL = "/geoserver/wms";
export const GEOSERVER_WFS_URL = "/geoserver/risetids/ows";

/* =========================================================
   KONFIGURASI LAYER
   ========================================================= */

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
    wsName: "risetids:Kab.Indragiri_Hilir-2",
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

/* =========================================================
   KONFIGURASI NOMOR PARIT
   ========================================================= */

const MIN_ZOOM_NOMOR = 13;

/* Membuat icon nomor */
const createNomorIcon = (nomor) => {
  return L.divIcon({
    className: "nomor-parit-wrapper",

    html:
      '<div class="nomor-parit">' +
      nomor +
      "</div>",

    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

/* =========================================================
   MENGAMBIL TITIK TENGAH GARIS
   ========================================================= */

const getTitikTengah = (geometry) => {
  if (!geometry || !geometry.coordinates) {
    return null;
  }

  let garis = [];

  if (geometry.type === "LineString") {
    garis = geometry.coordinates;
  } else if (geometry.type === "MultiLineString") {
    garis = geometry.coordinates.reduce(
      (terpanjang, current) => {
        if (current.length > terpanjang.length) {
          return current;
        }

        return terpanjang;
      },
      []
    );
  } else {
    return null;
  }

  if (!Array.isArray(garis) || garis.length === 0) {
    return null;
  }

  const titik = garis[Math.floor(garis.length / 2)];

  if (
    !Array.isArray(titik) ||
    titik.length < 2 ||
    !Number.isFinite(Number(titik[0])) ||
    !Number.isFinite(Number(titik[1]))
  ) {
    return null;
  }

  /*
    GeoJSON:
    [longitude, latitude]

    Leaflet:
    [latitude, longitude]
  */

  return [
    Number(titik[1]),
    Number(titik[0]),
  ];
};

/* =========================================================
   TRACKING ZOOM
   ========================================================= */

const ZoomTracker = ({ setZoom }) => {
  useMapEvents({
    zoomend: (event) => {
      setZoom(event.target.getZoom());
    },
  });

  return null;
};

/* =========================================================
   MENAMPILKAN NOMOR PARIT / TANGGUL
   ========================================================= */

const NomorParitTanggul = ({
  features,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <>
      {features.map((feature, index) => {
        const properties = feature.properties || {};

        const nama = properties.Nama;

        const posisi = getTitikTengah(
          feature.geometry
        );

        if (!nama || !posisi) {
          return null;
        }

        const nomor = index + 1;

        const markerKey =
          feature.id ||
          String(nama) +
            "-" +
            String(posisi[0]) +
            "-" +
            String(posisi[1]) +
            "-" +
            String(index);

        return (
          <Marker
            key={markerKey}
            position={posisi}
            icon={createNomorIcon(nomor)}
          >
            <Popup>
              <div className="popup-nama-parit">
                <strong>{nama}</strong>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

/* =========================================================
   MENGAMBIL DATA PARIT DARI GEOSERVER WFS
   ========================================================= */

const ParitTanggulData = ({
  enabled,
  zoom,
}) => {
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setFeatures([]);
      setError("");
      return undefined;
    }

    const controller = new AbortController();

    const params = new URLSearchParams();

    params.set("service", "WFS");
    params.set("version", "1.0.0");
    params.set("request", "GetFeature");
    params.set("typeName", "risetids:Parit_Tanggul");
    params.set("outputFormat", "application/json");
    params.set("srsName", "EPSG:4326");
    params.set("maxFeatures", "10000");

    const url =
      GEOSERVER_WFS_URL +
      "?" +
      params.toString();

    const loadFeatures = async () => {
      try {
        setError("");

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "GeoServer WFS mengembalikan HTTP " +
              response.status
          );
        }

        const data = await response.json();

        if (
          !data ||
          !Array.isArray(data.features)
        ) {
          throw new Error(
            "Respons WFS bukan GeoJSON FeatureCollection yang valid."
          );
        }

        setFeatures(data.features);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(
            "Error mengambil data WFS Parit/Tanggul:",
            err
          );

          setError(
            err.message ||
              "Gagal mengambil data Parit dan Tanggul."
          );

          setFeatures([]);
        }
      }
    };

    loadFeatures();

    return () => {
      controller.abort();
    };
  }, [enabled]);

  /*
    Jika zoom >= 13:
    nomor parit ditampilkan.

    Jika zoom < 13:
    nomor disembunyikan.
  */

  return (
    <>
      <NomorParitTanggul
        features={features}
        visible={
          enabled &&
          zoom >= MIN_ZOOM_NOMOR
        }
      />

      {error ? (
        <></>
      ) : null}
    </>
  );
};

/* =========================================================
   MAP PAGE
   ========================================================= */

const MapPage = () => {
  const [activeLayers, setActiveLayers] =
    useState({
      layerAdm: false,
      layerAdmDesa: false,
      layerKab: false,
      layerSungai: false,
      layerTanah: false,
      layerKelapa: false,
      layerDem: false,
      layerLahan: false,
      layerParit: false,
      layerPolaRuang: false,
    });

  const [zoom, setZoom] = useState(8);

  /* Toggle layer */

  const handleToggleLayer = (layerId) => {
    setActiveLayers((previous) => {
      return {
        ...previous,
        [layerId]: !previous[layerId],
      };
    });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar />

      {/* =================================================
          PANEL KANAN
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-8
          right-8
          top-24
          z-[1000]
          flex
          flex-col
          items-end
          justify-between
        "
      >

        {/* Layer Panel */}

        <div className="pointer-events-auto">
          <LayerPanel
            activeLayers={activeLayers}
            onToggle={handleToggleLayer}
          />
        </div>

        {/* Legend Panel */}

        <div className="pointer-events-auto">
          <LegendPanel
            activeLayers={activeLayers}
            layerConfigs={LAYER_CONFIG}
          />
        </div>

      </div>

      {/* =================================================
          MAP
      ================================================= */}

      <div
        className="
          absolute
          inset-0
          z-10
          h-full
          w-full
        "
      >

        <MapContainer
          center={[-0.4, 103.2]}
          zoom={8}
          className="h-full w-full"
          zoomControl={false}
        >

          {/* =================================================
              BASEMAP ESRI SATELLITE
          ================================================= */}

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />

          {/* =================================================
              WMS GEOSERVER
          ================================================= */}

          {LAYER_CONFIG.map((layer) => {

            if (!activeLayers[layer.id]) {
              return null;
            }

            return (
              <WMSTileLayer
                key={layer.id}
                url={GEOSERVER_WMS_URL}
                layers={layer.wsName}
                format="image/png"
                transparent={true}
                version="1.1.1"
                opacity={1}
              />
            );
          })}

          {/* =================================================
              TRACKING ZOOM
          ================================================= */}

          <ZoomTracker
            setZoom={setZoom}
          />

          {/* =================================================
              NOMOR PARIT / TANGGUL
          ================================================= */}

          <ParitTanggulData
            enabled={
              activeLayers.layerParit
            }
            zoom={zoom}
          />

          {/* =================================================
              ZOOM CONTROL
          ================================================= */}

          <ZoomControl position="bottomleft" />

        </MapContainer>

      </div>

      {/* =================================================
          CSS NOMOR PARIT
      ================================================= */}

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

          box-shadow:
            0 1px 5px
            rgba(0, 0, 0, 0.5);

          cursor: pointer;

          transition:
            transform 0.15s ease;
        }

        .nomor-parit:hover {
          background: #0077b6;

          color: #ffffff;

          transform: scale(1.2);
        }

        .popup-nama-parit {
          min-width: 120px;

          padding: 6px 10px;

          text-align: center;

          font-size: 14px;

          color: #263238;
        }

      `}</style>

    </div>
  );
};

export default MapPage;