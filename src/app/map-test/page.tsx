import MapLotViewer from "@/components/MapLotViewer";
import lotsData from "@/data/lots.json";

export default function TestMapPage() {
    // Cast the imported JSON to the expected type if necessary, or let TS infer
    return (
        <div className="w-screen h-screen">
            {/* @ts-ignore */}
            <MapLotViewer lots={lotsData} />
        </div>
    );
}
