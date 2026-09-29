import React, { useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, ZoomControl } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import Navbar from "../components/Navbar";
import LayerPanel from "../components/LayerPanel";
import LegendPanel from '../components/LegendPanel';

{/* Konfigurasi Layer */}
export const LAYER_CONFIG = [
    { id: 'layerAdm', name: 'Batas Administrasi Kecamatan', wsName: 'risetids:Batas_Administrasi_Kecamatan-LN' },
    { id: 'layerAdmDesa', name: 'Batas Administrasi Desa', wsName: 'risetids:Batas Administrasi Desa-LN' },
    { id: 'layerKab', name: 'Kabupaten Indragiri Hilir', wsName: 'risetdids:Kab.Indragiri_Hilir-2' },
    { id: 'layerSungai', name: 'Sungai Indragiri Hilir', wsName: 'risetids:Sungai_Indragiri_Hilir' },
    { id: 'layerTanah', name: 'Jenis Tanah', wsName: 'risetids:Jenis_Tanah_INHIL' },
    { id: 'layerKelapa', name: 'Sebaran Perkebunan Kelapa', wsName: 'risetids:Sebaran_Kebun_Kelapa' },
    { id: 'layerDem', name: 'Demnas', wsName: 'risetids:Demnas_Clip-2' },
    { id: 'layerLahan', name: 'Tutupan Lahan', wsName: 'risetids:Tutupan_Lahan' },
    { id: 'layerParit', name: 'Parit dan Tanggul', wsName: 'risetids:Parit_Tanggul' },
    { id: 'layerPolaRuang', name: 'Rencana Pola Ruang', wsName: 'risetids:Rencana Pola Ruang'}
];

{/* URL GEOSERVER */}
// export const GEOSERVER_URL = "http://localhost:8080/geoserver/risetids/wms";
// export const GEOSERVER_URL = "https://bondless-phrasing-wispy.ngrok-free.dev/geoserver/risetids/wms";
export const GEOSERVER_URL = "/geoserver/risetids/wms";
export const GEOSERVER_URL = "/geoserver/risetids/wfs";

{/* ZOOM MINIMUM UNTUK MENAMPILKAN NOMOR */}

const MIN_ZOOM_NOMOR = 13;

{/* MEMBUAT ICON NOMOR */}

const createNomorIcon = (nomor) => {

    return L.divIcon({

        className: "nomor-parit-wrapper",

        html: `
            <div class="nomor-parit">
                ${nomor}
            </div>
        `,

        iconSize: [26, 26],

        iconAnchor: [13, 13]

    });

};


{/* MENCARI TITIK TENGAH GARIS */}

const getTitikTengah = (geometry) => {

    if (!geometry) {
        return null;
    }


    let garis = [];


    // ----------------------------------------------
    // LINESTRING
    // ----------------------------------------------

    if (geometry.type === "LineString") {

        garis = geometry.coordinates;

    }


{/* MULTILINESTRING */}

    else if (geometry.type === "MultiLineString") {

        garis = geometry.coordinates.reduce(

            (terpanjang, current) => {

                return current.length > terpanjang.length
                    ? current
                    : terpanjang;

            },

            []

        );

    }


    else {

        return null;

    }


    if (!garis.length) {
        return null;
    }


{/* AMBIL TITIK TENGAH */}

    const indexTengah =
        Math.floor(garis.length / 2);


    const titik =
        garis[indexTengah];


    // GeoJSON:
    // [longitude, latitude]

    return [
        titik[1],
        titik[0]
    ];

};


{/* KOMPONEN UNTUK MEMANTAU ZOOM */}

const ZoomTracker = ({ setZoom }) => {

    useMapEvents({

        zoomend: (event) => {

            setZoom(
                event.target.getZoom()
            );

        }

    });

    return null;

};


{/* KOMPONEN NOMOR PARIT / TANGGUL */}

const NomorParitTanggul = ({
    features,
    visible
}) => {

    // Jangan tampilkan nomor
    // kalau zoom masih kecil

    if (!visible) {
        return null;
    }


    return (

        <>

            {features.map((feature, index) => {

                // ----------------------------------
                // AMBIL NAMA DARI POSTGRESQL
                // ----------------------------------

                const nama =
                    feature.properties?.Nama;


                // ----------------------------------
                // POSISI NOMOR
                // ----------------------------------

                const posisi =
                    getTitikTengah(
                        feature.geometry
                    );


                if (!nama || !posisi) {
                    return null;
                }


                // ----------------------------------
                // NOMOR
                //
                // Saat ini berdasarkan urutan
                // data WFS
                // ----------------------------------

                const nomor =
                    index + 1;


                return (

                    <Marker

                        key={
                            feature.id ||
                            `${nama}-${index}`
                        }

                        position={posisi}

                        icon={
                            createNomorIcon(
                                nomor
                            )
                        }

                    >

                        <Popup>

                            <div className="popup-nama-parit">

                                {nama}

                            </div>

                        </Popup>

                    </Marker>

                );

            })}

        </>

    );

};


{/* KOMPONEN DATA PARIT DAN TANGGUL */}

const ParitTanggulData = ({
    enabled,
    zoom
}) => {

    const [features, setFeatures] =
        useState([]);


    {/* AMBIL DATA WFS */}

    useEffect(() => {

        // Kalau layer tidak aktif
        // tidak perlu mengambil data

        if (!enabled) {

            setFeatures([]);

            return;

        }


        const controller =
            new AbortController();


        {/* PARAMETER WFS */}

        const params =
            new URLSearchParams({

                service: "WFS",

                version: "1.0.0",

                request: "GetFeature",

                typeName:
                    "webgis:Parit_Tanggul",

                outputFormat:
                    "application/json"

            });


        {/* URL WFS */}

        const url =
            `${GEOSERVER_WFS_URL}?${params.toString()}`;


        {/* FETCH */}

        fetch(url, {

            signal:
                controller.signal

        })

            .then((response) => {

                if (!response.ok) {

                    throw new Error(
                        "Gagal mengambil data Parit dan Tanggul dari GeoServer"
                    );

                }

                return response.json();

            })

            .then((data) => {

                console.log(
                    "Data WFS Parit/Tanggul:",
                    data
                );


                setFeatures(
                    data.features || []
                );

            })

            .catch((error) => {

                if (
                    error.name !==
                    "AbortError"
                ) {

                    console.error(
                        "Error WFS:",
                        error
                    );

                }

            });


        {/* CLEANUP */}

        return () => {

            controller.abort();

        };

    }, [enabled]);


    {/* TAMPILKAN NOMOR */}

    return (

        <NomorParitTanggul

            features={features}

            visible={
                enabled &&
                zoom >= MIN_ZOOM_NOMOR
            }

        />

    );

};



{/* MAP PAGE */}

const MapPage = () => {


    {/* STATE LAYER AKTIF */}

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
        layerPolaRuang: false
    });


    {/* STATE ZOOM */}

    const [
        zoom,
        setZoom
    ] = useState(8);


    {/* TOGGLE LAYER */}

    const handleToggleLayer = (layerId) => {
        setActiveLayers((prev) => ({
            ...prev,
            [layerId]: !prev[layerId]
        }));
    };



    {/* RETURN */}

    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <Navbar />

            <div className="absolute top-24 right-8 bottom-8 z-[1000] flex flex-col justify-between items-end pointer-events-none">
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
         

            {/* Kontainer peta */}

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
                    {LAYER_CONFIG.map((layer) => (
                        activeLayers[layer.id] && (
                            <WMSTileLayer 
                                key={layer.id}
                                url={GEOSERVER_URL}
                                layers={layer.wsName}
                                format="image/png"
                                transparent={true}
                            />
                        )
                    ))}


                    {/* MONITOR ZOOM */}

                    <ZoomTracker

                        setZoom={
                            setZoom
                        }

                    />


                    {/* NOMOR PARIT / TANGGUL */}

                    <ParitTanggulData

                        enabled={
                            activeLayers.layerParit
                        }

                        zoom={
                            zoom
                        }

                    />


                    {/* ZOOM CONTROL */}

                    <ZoomControl position="bottomleft"/>
                </MapContainer>

            </div>

            {/* STYLE NOMOR */}

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

                    border:
                        2px solid #0077b6;

                    border-radius: 50%;

                    color: #0077b6;

                    font-size: 11px;

                    font-weight: bold;

                    box-shadow:
                        0 1px 5px
                        rgba(0,0,0,0.5);

                    cursor: pointer;

                    transition:
                        transform 0.15s ease;

                }


                .nomor-parit:hover {

                    background: #0077b6;

                    color: #ffffff;

                    transform:
                        scale(1.2);

                }


                .popup-nama-parit {

                    min-width: 100px;

                    padding:
                        5px 8px;

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