import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SellerShop {
  shop_name: string;
  shop_address: string | null;
  latitude: number;
  longitude: number;
}

const defaultStores = [
  { shop_name: "Billa", latitude: 42.4304, longitude: 25.6250, shop_address: "бул. Цар Симеон Велики 100" },
  { shop_name: "Lidl", latitude: 42.4260, longitude: 25.6190, shop_address: "бул. Патриарх Евтимий 23" },
  { shop_name: "Metro", latitude: 42.4150, longitude: 25.6400, shop_address: "Индустриална зона" },
  { shop_name: "Kaufland", latitude: 42.4350, longitude: 25.6100, shop_address: "бул. Славянски 4" },
];

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [shops, setShops] = useState<SellerShop[]>(defaultStores);
  const { t } = useI18n();

  useEffect(() => {
    const loadSellerShops = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("shop_name, shop_address, latitude, longitude")
        .eq("role", "seller")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .not("shop_name", "is", null);

      if (data && data.length > 0) {
        const sellerShops = data.filter(
          (s: any) => s.latitude && s.longitude && s.shop_name
        ) as SellerShop[];
        // Merge default stores + seller shops (avoid duplicates by name)
        const defaultNames = new Set(defaultStores.map(s => s.shop_name.toLowerCase()));
        const uniqueSeller = sellerShops.filter(s => !defaultNames.has(s.shop_name.toLowerCase()));
        setShops([...defaultStores, ...uniqueSeller]);
      }
    };
    loadSellerShops();
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([42.4280, 25.6200], 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when shops change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    shops.forEach((store) => {
      L.marker([store.latitude, store.longitude], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`<b>${store.shop_name}</b><br/>${store.shop_address || ""}`);
    });
  }, [shops]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("map.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("map.desc")}</p>
          <div ref={mapRef} className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-border" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {shops.map((s, i) => (
              <motion.div key={i} whileHover={{ y: -2 }} className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="font-bold text-foreground">{s.shop_name}</p>
                <p className="text-sm text-muted-foreground">{s.shop_address || ""}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MapPage;
