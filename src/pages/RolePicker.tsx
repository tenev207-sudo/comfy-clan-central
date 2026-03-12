import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Store, Leaf, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const RolePicker = () => {
  const [selected, setSelected] = useState<"buyer" | "seller" | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [lat, setLat] = useState<number>(42.4280);
  const [lng, setLng] = useState<number>(25.6200);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (data && data.length > 0) {
        navigate(data[0].role === "seller" ? "/seller" : "/buyer");
      }
    };
    checkRole();
  }, [navigate]);

  // Initialize map when seller is selected
  useEffect(() => {
    if (selected !== "seller" || !mapRef.current || mapInstanceRef.current) return;

    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const map = L.map(mapRef.current).setView([42.4280, 25.6200], 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const marker = L.marker([42.4280, 25.6200], { icon: defaultIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLat(pos.lat);
      setLng(pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    });

    // Force re-render of map tiles
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [selected]);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: session.user.id,
        role: selected,
      });
      if (roleError) throw roleError;

      if (selected === "seller") {
        await supabase.from("profiles").update({
          shop_name: shopName,
          shop_address: shopAddress,
          role: "seller",
          latitude: lat,
          longitude: lng,
        }).eq("user_id", session.user.id);
      } else {
        await supabase.from("profiles").update({ role: "buyer" }).eq("user_id", session.user.id);
      }

      navigate(selected === "seller" ? "/seller" : "/buyer");
    } catch (err: any) {
      toast({ title: t("auth.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Leaf className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-foreground">{t("role.title")}</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {(["buyer", "seller"] as const).map((role) => (
            <motion.div key={role} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Card
                className={`cursor-pointer border-2 transition-all ${selected === role ? "border-primary shadow-lg" : "border-border hover:border-primary/30"}`}
                onClick={() => setSelected(role)}
              >
                <CardContent className="pt-6 pb-4 text-center">
                  {role === "buyer" ? (
                    <ShoppingBag className="h-10 w-10 text-primary mx-auto mb-3" />
                  ) : (
                    <Store className="h-10 w-10 text-primary mx-auto mb-3" />
                  )}
                  <h3 className="font-bold text-lg text-foreground">
                    {role === "buyer" ? t("role.buyerTitle") : t("role.sellerTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role === "buyer" ? t("role.buyerDesc") : t("role.sellerDesc")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {selected === "seller" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 mb-6">
            <div>
              <Label>{t("role.shopName")}</Label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Billa, Lidl..." />
            </div>
            <div>
              <Label>{t("role.shopAddress")}</Label>
              <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="ул. Цар Иван Шишман 12" />
            </div>
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <MapPin className="h-4 w-4" /> {t("role.pickLocation")}
              </Label>
              <div ref={mapRef} className="w-full h-[250px] rounded-xl overflow-hidden border border-border" />
              <p className="text-xs text-muted-foreground mt-1">
                {t("role.clickMap")}
              </p>
            </div>
          </motion.div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!selected || loading || (selected === "seller" && !shopName)}
          onClick={handleContinue}
        >
          {loading ? t("auth.loading") : t("role.continue")}
        </Button>
      </motion.div>
    </div>
  );
};

export default RolePicker;
