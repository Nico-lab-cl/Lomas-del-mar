
import fs from 'fs';
import path from 'path';
import numeric from 'numeric';

interface LayoutPosition {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    size?: number;
}

interface Anchor {
    id: number;
    lat: number;
    lng: number;
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

const LAYOUT_PATH = path.join(__dirname, '../src/services/layoutPositions.json');
const OUTPUT_PATH = path.join(__dirname, '../src/services/lotPolygons.json');

// ANCHORS PROVIDED BY USER
const ANCHORS: Anchor[] = [
    { id: 132, lat: -33.46010, lng: -71.61603 }, // Top-Left
    { id: 64, lat: -33.46125, lng: -71.61411 }, // Middle
    { id: 28, lat: -33.46195, lng: -71.61145 }  // Bottom-Right
];

// Load raw layout data
const rawLayout = JSON.parse(fs.readFileSync(LAYOUT_PATH, 'utf-8'));
const positions: Record<string, LayoutPosition> = rawLayout.positions;

// Extract anchor positions from layout
const anchorPoints: { x: number; y: number; lat: number; lng: number }[] = [];

ANCHORS.forEach(anchor => {
    const pos = positions[String(anchor.id)];
    if (!pos) {
        console.error(`ERROR: Anchor ID ${anchor.id} not found in layoutPositions.json`);
        process.exit(1);
    }
    console.log(`Anchor ${anchor.id}: X=${pos.x}, Y=${pos.y} -> Lat=${anchor.lat}, Lng=${anchor.lng}`);
    anchorPoints.push({ x: pos.x, y: pos.y, lat: anchor.lat, lng: anchor.lng });
});

if (anchorPoints.length < 3) {
    console.error("Not enough anchor points found.");
    process.exit(1);
}

// Solve Affine Transform
// Lat = A*x + B*y + C
// Lng = D*x + E*y + F

// Matrix M for [A, B, C] and [D, E, F]
// [x1, y1, 1] [A]   [lat1]
// [x2, y2, 1] [B] = [lat2]
// [x3, y3, 1] [C]   [lat3]

const M = anchorPoints.map(p => [p.x, p.y, 1]);
const Y_lat = anchorPoints.map(p => p.lat);
const Y_lng = anchorPoints.map(p => p.lng);

// Solve for coefficients
// Coeffs = inv(M) * Y
const invM = numeric.inv(M);
if (!invM) {
    console.error("Matrix inversion failed. Points might be collinear.");
    process.exit(1);
}

const coeffsLat = numeric.dot(invM, Y_lat) as number[]; // [A, B, C]
const coeffsLng = numeric.dot(invM, Y_lng) as number[]; // [D, E, F]

console.log('Affine Coefficients Lat:', coeffsLat);
console.log('Affine Coefficients Lng:', coeffsLng);

const transformToGPS = (x: number, y: number): Coordinate => {
    const lat = coeffsLat[0] * x + coeffsLat[1] * y + coeffsLat[2];
    const lng = coeffsLng[0] * x + coeffsLng[1] * y + coeffsLng[2];
    return { lat, lng };
};

// Generate Polygons
const polygons: LotPolygon[] = [];
// Approx 15m in degrees (variable depending on lat, but good enough approx)
const DELTA = 0.00008;

Object.entries(positions).forEach(([idStr, pos]) => {
    const center = transformToGPS(pos.x, pos.y);

    // Create a square around the center
    const paths: Coordinate[] = [
        { lat: center.lat + DELTA, lng: center.lng - DELTA }, // Top-Left
        { lat: center.lat + DELTA, lng: center.lng + DELTA }, // Top-Right
        { lat: center.lat - DELTA, lng: center.lng + DELTA }, // Bottom-Right
        { lat: center.lat - DELTA, lng: center.lng - DELTA }  // Bottom-Left
    ];

    polygons.push({
        id: Number(idStr),
        center,
        paths
    });
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(polygons, null, 2));
console.log(`✅ Generated ${polygons.length} lot polygons in ${OUTPUT_PATH}`);
