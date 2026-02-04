
import fs from 'fs';
import path from 'path';

// === CONFIGURACIÓN DE RUTAS ===
const LAYOUT_PATH = path.join(__dirname, '../src/services/layoutPositions.json');
const OUTPUT_PATH = path.join(__dirname, '../src/services/lotPolygons.json');

// === NUEVO DATO MAESTRO: EL PERÍMETRO REAL ===
const BOUNDARY_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    [-71.61336295553875, -33.45944935441236],
                    [-71.61492265532192, -33.46010078519482],
                    [-71.61603370149442, -33.45997573927592],
                    [-71.616518647176, -33.46089065493413],
                    [-71.61666274908745, -33.46093828878705],
                    [-71.61523544012934, -33.462392197536865],
                    [-71.61107758574472, -33.462039098251495],
                    [-71.613242324041, -33.460812954104135],
                    [-71.61255872249541, -33.459824422301246],
                    [-71.61254732913645, -33.45962481355081],
                    [-71.6133592463238, -33.45944871549834]
                ],
                "type": "LineString"
            }
        }
    ]
};

// Interfaces
interface LayoutPosition {
    x: number; // 0-100
    y: number; // 0-100
}
interface Coordinate {
    lat: number;
    lng: number;
}
interface LotPolygon {
    id: number;
    center: Coordinate;
    paths: Coordinate[];
}

// 1. Calcular los límites geográficos reales (Bounding Box)
const coords = BOUNDARY_GEOJSON.features[0].geometry.coordinates;
const lats = coords.map(c => c[1]);
const lngs = coords.map(c => c[0]);

const GEO_BOUNDS = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
};

console.log('🌍 Límites GPS Calculados:', GEO_BOUNDS);

// 2. Cargar posiciones relativas
const rawLayout = JSON.parse(fs.readFileSync(LAYOUT_PATH, 'utf-8'));
const positions: Record<string, LayoutPosition> = rawLayout.positions;

// 3. Función de Transformación (Interpolación Lineal)
const transformToGPS = (xPercent: number, yPercent: number): Coordinate => {
    // Normalizar porcentajes a 0-1
    const x = xPercent / 100;
    const y = yPercent / 100;

    // Mapear X (0-1) al rango de Longitud (Oeste -> Este)
    const lng = GEO_BOUNDS.minLng + (x * (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng));

    // Mapear Y (0-1) al rango de Latitud (Norte -> Sur)
    // IMPORTANTE: En web Y=0 es arriba. En mapa, Arriba es Mayor Latitud.
    // Por tanto, Y=0 debe ser maxLat, Y=1 debe ser minLat.
    const lat = GEO_BOUNDS.maxLat - (y * (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat));

    return { lat, lng };
};

// 4. Generar Polígonos
const polygons: LotPolygon[] = [];
// Tamaño del lote en grados (aprox 12-15 metros)
const SIZE_DEG = 0.00008;

Object.entries(positions).forEach(([idStr, pos]) => {
    const center = transformToGPS(pos.x, pos.y);

    // Generar cuadrado alrededor del centro
    const paths: Coordinate[] = [
        { lat: center.lat + SIZE_DEG, lng: center.lng - SIZE_DEG }, // Top-Left
        { lat: center.lat + SIZE_DEG, lng: center.lng + SIZE_DEG }, // Top-Right
        { lat: center.lat - SIZE_DEG, lng: center.lng + SIZE_DEG }, // Bottom-Right
        { lat: center.lat - SIZE_DEG, lng: center.lng - SIZE_DEG }  // Bottom-Left
    ];

    polygons.push({
        id: Number(idStr),
        center,
        paths
    });
});

// 5. Guardar
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(polygons, null, 2));
console.log(`✅ Mapa regenerado usando perímetro real. ${polygons.length} lotes procesados.`);
