import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Package, ClipboardList, MapPin, Clock, CreditCard, Banknote, Trash2, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface SelectedItem {
  id: string;
  type: "surprise_box" | "product";
  title: string;
  shop: string;
  price: number;
  data: any;
}

const BuyerDashboard = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
    };
    init();
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const [boxRes, prodRes, ordRes] = await Promise.all([
      supabase.from("surprise_boxes").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("buyer_id", userId).order("created_at", { ascending: false }),
    ]);
    if (boxRes.data) setBoxes(boxRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (ordRes.data) setOrders(ordRes.data);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addToSelection = (item: any, type: "surprise_box" | "product") => {
    const exists = selectedItems.find(s => s.id === item.id);
    if (exists) {
      toast({ title: t("buyer.alreadyAdded"), description: t("buyer.alreadyAddedDesc") });
      return;
    }
    const newItem: SelectedItem = {
      id: item.id,
      type,
      title: type === "surprise_box" ? item.title : item.name,
      shop: type === "surprise_box" ? item.shop_name : item.shop,
      price: type === "surprise_box" ? item.price : item.new_price,
      data: item,
    };
    setSelectedItems(prev => [...prev, newItem]);
    setCartOpen(true);
    toast({ title: "✅", description: `${newItem.title} ${t("buyer.addedToCart")}` });
  };

  const removeFromSelection = (id: string) => {
    setSelectedItems(prev => prev.filter(s => s.id !== id));
  };

  const totalPrice = selectedItems.reduce((sum, s) => sum + Number(s.price), 0);

  const handleConfirmOrder = async () => {
    if (!userId || selectedItems.length === 0) return;
    setLoading(true);
    try {
      for (const item of selectedItems) {
        const sellerId = item.data.seller_id;
        if (!sellerId) throw new Error("Seller not found");

        const { error } = await supabase.from("orders").insert({
          buyer_id: userId,
          seller_id: sellerId,
          item_type: item.type,
          item_id: item.id,
          quantity: 1,
          total_price: item.price,
          payment_method: paymentMethod as any,
          status: paymentMethod === "cash" ? "pending" : "paid",
          expires_at: item.type === "surprise_box" ? item.data.pickup_end : item.data.expiry_date,
        });
        if (error) throw error;

        // Decrease quantity
        if (item.type === "surprise_box") {
          const newQty = item.data.quantity - 1;
          await supabase.from("surprise_boxes").update({
            quantity: newQty,
            is_active: newQty > 0,
          }).eq("id", item.id);
        } else {
          const newStock = item.data.stock - 1;
          await supabase.from("products").update({
            stock: newStock,
            is_active: newStock > 0,
          }).eq("id", item.id);
        }
      }

      toast({ title: t("checkout.success"), description: t("checkout.pickupInfo") });
      setSelectedItems([]);
      setCartOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: t("auth.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-500/10 text-yellow-700";
      case "paid": return "bg-blue-500/10 text-blue-700";
      case "ready": return "bg-primary/10 text-primary";
      case "picked_up": return "bg-green-500/10 text-green-700";
      case "expired": case "refunded": return "bg-muted text-muted-foreground";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">{t("buyer.title")}</h1>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <ShoppingCart className="h-4 w-4" />
                  {t("buyer.mySelection")}
                  {selectedItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {selectedItems.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col">
                <SheetHeader>
                  <SheetTitle>{t("buyer.mySelection")} ({selectedItems.length})</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>{t("buyer.emptySelection")}</p>
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.shop}</p>
                            <p className="text-sm font-bold text-primary mt-1">{Number(item.price).toFixed(2)} {t("common.lv")}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromSelection(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <div className="border-t border-border pt-4 mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{t("checkout.total")}:</span>
                      <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)} {t("common.lv")}</span>
                    </div>

                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <RadioGroupItem value="card" id="card-pay" />
                        <Label htmlFor="card-pay" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-4 w-4 text-primary" /> {t("checkout.payCard")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <RadioGroupItem value="cash" id="cash-pay" />
                        <Label htmlFor="cash-pay" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Banknote className="h-4 w-4 text-primary" /> {t("checkout.payCash")}
                        </Label>
                      </div>
                    </RadioGroup>

                    <Button className="w-full" size="lg" onClick={handleConfirmOrder} disabled={loading}>
                      {loading ? t("auth.loading") : t("checkout.confirm")}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>

          <Tabs defaultValue="boxes">
            <TabsList className="mb-6">
              <TabsTrigger value="boxes" className="gap-1"><ShoppingBag className="h-4 w-4" /> {t("buyer.surpriseBoxes")}</TabsTrigger>
              <TabsTrigger value="products" className="gap-1"><Package className="h-4 w-4" /> {t("buyer.products")}</TabsTrigger>
              <TabsTrigger value="orders" className="gap-1"><ClipboardList className="h-4 w-4" /> {t("buyer.myOrders")}</TabsTrigger>
            </TabsList>

            <TabsContent value="boxes">
              {boxes.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noBoxes")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boxes.map((b) => (
                    <motion.div key={b.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                      <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="bg-gradient-to-r from-primary to-accent h-28 flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-primary-foreground" />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-foreground">{b.title}</h3>
                            <Badge variant="secondary">{b.quantity} {t("buyer.left")}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{b.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" /> {b.shop_name} {b.shop_address && `• ${b.shop_address}`}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                            <Clock className="h-3 w-3" /> {t("buyer.pickupWindow")}: {format(new Date(b.pickup_start), "HH:mm")} - {format(new Date(b.pickup_end), "HH:mm")}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs line-through text-muted-foreground mr-1">{Number(b.original_value).toFixed(2)}</span>
                              <span className="text-lg font-bold text-primary">{Number(b.price).toFixed(2)} {t("common.lv")}</span>
                            </div>
                            <Button size="sm" onClick={() => addToSelection(b, "surprise_box")} disabled={b.quantity <= 0}>
                              {t("buyer.reserve")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products">
              {products.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noProducts")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-foreground mb-1">{p.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{p.shop}</p>
                        <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs line-through text-muted-foreground mr-1">{Number(p.old_price).toFixed(2)}</span>
                            <span className="text-lg font-bold text-primary">{Number(p.new_price).toFixed(2)} {t("common.lv")}</span>
                          </div>
                          <Button size="sm" onClick={() => addToSelection(p, "product")} disabled={p.stock <= 0}>
                            {t("buyer.reserve")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders">
              {orders.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noOrders")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <Card key={o.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-foreground">{o.order_number}</p>
                          <Badge className={statusColor(o.status)}>{o.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{Number(o.total_price).toFixed(2)} {t("common.lv")} • {o.payment_method === "card" ? t("checkout.payCard") : t("checkout.payCash")}</p>
                        {(o.status === "paid" || o.status === "ready") && (
                          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                            <p className="text-sm text-muted-foreground">{t("buyer.pickupCode")}</p>
                            <p className="text-2xl font-mono font-bold text-primary tracking-wider">{o.pickup_code}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
