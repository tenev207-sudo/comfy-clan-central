import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Store, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";

const RolePicker = () => {
  const [selected, setSelected] = useState<"buyer" | "seller" | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    // If user already has a role, redirect
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
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
