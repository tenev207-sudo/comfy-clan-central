import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const stores = [
  { name: "Billa", lat: 42.4304, lng: 25.6250, address: "бул. Цар Симеон Велики 100" },
  { name: "Lidl", lat: 42.4260, lng: 25.6190, address: "бул. Патриарх Евтимий 23" },
  { name: "Metro", lat: 42.4150, lng: 25.6400, address: "Индустриална зона" },
  { name: "Kaufland", lat: 42.4350, lng: 25.6100, address: "бул. Славянски 4" },
  { name: "Billa 2", lat: 42.4280, lng: 25.6350, address: "ул. Генерал Гурко 68" },
  { name: "Lidl 2", lat: 42.4380, lng: 25.6280, address: "бул. Никола Петков" },
  { name: "Kaufland 2", lat: 42.4200, lng: 25.6050, address: "ул. Индустриална 15" },
];

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([42.4280, 25.6200], 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Fix default icon
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    stores.forEach((store) => {
      L.marker([store.lat, store.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`<b>${store.name}</b><br/>${store.address}`);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("map.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("map.desc")}</p>
          <div ref={mapRef} className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-border" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {stores.map((s, i) => (
              <motion.div key={i} whileHover={{ y: -2 }} className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="font-bold text-foreground">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.address}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MapPage;
