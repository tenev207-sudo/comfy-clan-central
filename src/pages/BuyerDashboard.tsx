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
import { ShoppingBag, Package, ClipboardList, MapPin, Clock, CreditCard, Banknote, Trash2, ShoppingCart, Store, Zap, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { toEur } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface SelectedItem {
  id: string;
  type: "surprise_box" | "product" | "flash_sale";
  title: string;
  shop: string;
  price: number;
  data: any;
}

interface SellerShop {
  user_id: string;
  shop_name: string;
  shop_address: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Haversine distance in meters
function getDistanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface StreetBundle {
  id: string;
  shops: SellerShop[];
  products: any[];
  totalOldPrice: number;
  totalNewPrice: number;
  centerAddress: string;
}

const BuyerDashboard = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sellers, setSellers] = useState<SellerShop[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("markets");
  const [filterShop, setFilterShop] = useState<string | null>(null);
  const [flashNotification, setFlashNotification] = useState<any | null>(null);
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
    const [boxRes, prodRes, ordRes, sellerRes, flashRes] = await Promise.all([
      supabase.from("surprise_boxes").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("buyer_id", userId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, shop_name, shop_address, latitude, longitude").eq("role", "seller").not("shop_name", "is", null),
      supabase.from("flash_sales" as any).select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    if (boxRes.data) setBoxes(boxRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (ordRes.data) setOrders(ordRes.data);
    if (sellerRes.data) setSellers(sellerRes.data as SellerShop[]);
    if (flashRes.data) setFlashSales(flashRes.data as any[]);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime flash sale notifications
  useEffect(() => {
    const channel = supabase
      .channel("flash-sales-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "flash_sales" }, (payload) => {
        const newSale = payload.new as any;
        setFlashNotification(newSale);
        setFlashSales((prev) => [newSale, ...prev]);
        // Auto-dismiss after 10s
        setTimeout(() => setFlashNotification(null), 10000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addToSelection = (item: any, type: "surprise_box" | "product" | "flash_sale") => {
    const exists = selectedItems.find(s => s.id === item.id);
    if (exists) {
      toast({ title: t("buyer.alreadyAdded"), description: t("buyer.alreadyAddedDesc") });
      return;
    }
    const newItem: SelectedItem = {
      id: item.id,
      type,
      title: type === "surprise_box" ? item.title : (type === "flash_sale" ? item.title : item.name),
      shop: type === "surprise_box" ? item.shop_name : (type === "flash_sale" ? item.shop_name : item.shop),
      price: type === "surprise_box" ? item.price : (type === "flash_sale" ? item.flash_price : item.new_price),
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
          expires_at: item.type === "surprise_box" ? item.data.pickup_end : (item.type === "flash_sale" ? item.data.expires_at : item.data.expiry_date),
        });
        if (error) throw error;
        if (item.type === "surprise_box") {
          const newQty = item.data.quantity - 1;
          await supabase.from("surprise_boxes").update({ quantity: newQty, is_active: newQty > 0 }).eq("id", item.id);
        } else if (item.type === "product") {
          const newStock = item.data.stock - 1;
          await supabase.from("products").update({ stock: newStock, is_active: newStock > 0 }).eq("id", item.id);
        } else if (item.type === "flash_sale") {
          const newQty = item.data.quantity - 1;
          await supabase.from("flash_sales" as any).update({ quantity: newQty, is_active: newQty > 0 } as any).eq("id", item.id);
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

  const filteredProducts = filterShop ? products.filter(p => p.shop === filterShop) : products;
  const filteredBoxes = filterShop ? boxes.filter(b => b.shop_name === filterShop) : boxes;

  const handleShopClick = (shopName: string) => {
    setFilterShop(shopName);
    setActiveTab("products");
  };

  // Build Community Bundles (Street Boxes) by grouping nearby sellers (within 500m)
  const streetBundles: StreetBundle[] = (() => {
    const sellersWithCoords = sellers.filter(s => s.latitude && s.longitude);
    const used = new Set<string>();
    const bundles: StreetBundle[] = [];

    for (const seller of sellersWithCoords) {
      if (used.has(seller.user_id)) continue;
      const nearby = sellersWithCoords.filter(
        s => s.user_id !== seller.user_id && !used.has(s.user_id) &&
          getDistanceM(seller.latitude!, seller.longitude!, s.latitude!, s.longitude!) <= 500
      );
      if (nearby.length === 0) continue; // Need at least 2 shops

      const group = [seller, ...nearby];
      group.forEach(s => used.add(s.user_id));

      const groupProducts = products.filter(p =>
        group.some(s => p.seller_id === s.user_id || p.shop === s.shop_name) && p.stock > 0
      );
      if (groupProducts.length === 0) continue;

      const totalOld = groupProducts.reduce((sum, p) => sum + Number(p.old_price), 0);
      const totalNew = groupProducts.reduce((sum, p) => sum + Number(p.new_price), 0);

      bundles.push({
        id: group.map(s => s.user_id).join("-"),
        shops: group,
        products: groupProducts,
        totalOldPrice: totalOld,
        totalNewPrice: totalNew,
        centerAddress: seller.shop_address || seller.shop_name || "Nearby shops",
      });
    }
    return bundles;
  })();

  const handleReserveBundle = (bundle: StreetBundle) => {
    for (const p of bundle.products) {
      addToSelection(p, "product");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Flash Sale Notification Banner */}
      <AnimatePresence>
        {flashNotification && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-16 left-0 right-0 z-50 px-4 pt-2"
          >
            <div className="container mx-auto">
              <Card className="border-2 border-accent bg-accent/5 shadow-lg">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t("flash.new")} {flashNotification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {flashNotification.shop_name} • {toEur(Number(flashNotification.flash_price))} {t("common.lv")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => {
                      addToSelection(flashNotification, "flash_sale");
                      setFlashNotification(null);
                    }}>
                      {t("flash.grab")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setFlashNotification(null)}>✕</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">{t("buyer.title")}</h1>
            <div className="flex items-center gap-2">
              <DeleteAccountButton />
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
                              <p className="text-sm font-bold text-primary mt-1">{toEur(Number(item.price))} {t("common.lv")}</p>
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
                        <span className="text-xl font-bold text-primary">{toEur(totalPrice)} {t("common.lv")}</span>
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
          </div>

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "markets") setFilterShop(null); }}>
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="markets" className="gap-1"><Store className="h-4 w-4" /> {t("buyer.allMarkets")}</TabsTrigger>
              <TabsTrigger value="products" className="gap-1"><Package className="h-4 w-4" /> {t("buyer.products")}</TabsTrigger>
              <TabsTrigger value="boxes" className="gap-1"><ShoppingBag className="h-4 w-4" /> {t("buyer.surpriseBoxes")}</TabsTrigger>
              <TabsTrigger value="flash" className="gap-1 relative">
                <Zap className="h-4 w-4" /> {t("flash.title")}
                {flashSales.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center">
                    {flashSales.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bundles" className="gap-1"><Users className="h-4 w-4" /> {t("bundle.title")}</TabsTrigger>
              <TabsTrigger value="orders" className="gap-1"><ClipboardList className="h-4 w-4" /> {t("buyer.myOrders")}</TabsTrigger>
            </TabsList>

            {/* Markets Tab */}
            <TabsContent value="markets">
              {sellers.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noProducts")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sellers.map((s) => {
                    const shopProducts = products.filter(p => p.seller_id === s.user_id || p.shop === s.shop_name);
                    const shopBoxes = boxes.filter(b => b.seller_id === s.user_id || b.shop_name === s.shop_name);
                    const totalItems = shopProducts.length + shopBoxes.length;
                    return (
                      <motion.div key={s.user_id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleShopClick(s.shop_name!)}>
                          <div className="bg-gradient-to-r from-primary to-accent h-24 flex items-center justify-center">
                            <Store className="h-10 w-10 text-primary-foreground" />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold text-foreground text-lg">{s.shop_name}</h3>
                            {s.shop_address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" /> {s.shop_address}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="secondary">{totalItems} {t("buyer.products").toLowerCase()}</Badge>
                              <Button size="sm" variant="outline">{t("buyer.viewProducts")}</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              {filterShop && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-sm px-3 py-1">{filterShop}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setFilterShop(null)}>{t("buyer.allProducts")}</Button>
                </div>
              )}
              {filteredProducts.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noProducts")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => (
                    <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-foreground mb-1">{p.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{p.shop}</p>
                        <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs line-through text-muted-foreground mr-1">{toEur(Number(p.old_price))}</span>
                            <span className="text-lg font-bold text-primary">{toEur(Number(p.new_price))} {t("common.lv")}</span>
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

            {/* Boxes Tab */}
            <TabsContent value="boxes">
              {filterShop && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-sm px-3 py-1">{filterShop}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setFilterShop(null)}>{t("buyer.allProducts")}</Button>
                </div>
              )}
              {filteredBoxes.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noBoxes")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoxes.map((b) => (
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
                              <span className="text-xs line-through text-muted-foreground mr-1">{toEur(Number(b.original_value))}</span>
                              <span className="text-lg font-bold text-primary">{toEur(Number(b.price))} {t("common.lv")}</span>
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

            {/* Flash Sales Tab */}
            <TabsContent value="flash">
              <p className="text-sm text-muted-foreground mb-4">{t("flash.title")} – {t("flash.noItems").replace("No active flash sales right now.", "").replace("Няма активни светкавични оферти.", "")}</p>
              {flashSales.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("flash.noItems")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flashSales.map((f: any) => (
                    <motion.div key={f.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
                      <Card className="overflow-hidden border-2 border-accent/40 hover:border-accent transition-colors">
                        <div className="bg-gradient-to-r from-accent to-accent/60 p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-background/20 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-accent-foreground">{f.title}</p>
                            <p className="text-xs text-accent-foreground/80">{f.shop_name}</p>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          {f.description && <p className="text-sm text-muted-foreground mb-2">{f.description}</p>}
                          {f.shop_address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" /> {f.shop_address}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                            <Clock className="h-3 w-3" /> {t("flash.expiresAt")}: {format(new Date(f.expires_at), "HH:mm")}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs line-through text-muted-foreground mr-1">{toEur(Number(f.original_price))}</span>
                              <span className="text-lg font-bold text-accent">{toEur(Number(f.flash_price))} {t("common.lv")}</span>
                            </div>
                            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => addToSelection(f, "flash_sale")} disabled={f.quantity <= 0}>
                              {t("flash.grab")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Community Bundles (Street Boxes) Tab */}
            <TabsContent value="bundles">
              <p className="text-sm text-muted-foreground mb-4">{t("bundle.desc")}</p>
              {streetBundles.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("bundle.noItems")}</CardContent></Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {streetBundles.map((bundle) => {
                    const savings = bundle.totalOldPrice - bundle.totalNewPrice;
                    return (
                      <motion.div key={bundle.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors">
                          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-5 w-5 text-primary" />
                              <h3 className="font-bold text-foreground">{t("bundle.title")}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {bundle.centerAddress}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">{bundle.shops.length} {t("bundle.shops")}</Badge>
                              <Badge variant="secondary">{bundle.products.length} {t("bundle.items")}</Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2 mb-3">
                              {bundle.products.slice(0, 4).map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-sm">
                                  <span className="text-foreground truncate flex-1">{p.name}</span>
                                  <span className="text-muted-foreground ml-2">{p.shop}</span>
                                  <span className="font-semibold text-primary ml-2">{toEur(Number(p.new_price))} {t("common.lv")}</span>
                                </div>
                              ))}
                              {bundle.products.length > 4 && (
                                <p className="text-xs text-muted-foreground">+{bundle.products.length - 4} more...</p>
                              )}
                            </div>
                            <div className="border-t border-border pt-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">{t("bundle.savings")}: <span className="font-bold text-primary">{toEur(savings)} {t("common.lv")}</span></p>
                                <p className="text-lg font-bold text-foreground">{toEur(bundle.totalNewPrice)} {t("common.lv")}</p>
                              </div>
                              <Button size="sm" onClick={() => handleReserveBundle(bundle)}>
                                {t("bundle.reserveAll")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Orders Tab */}
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
                          <div className="flex gap-2">
                            {o.item_type === "b2b" && <Badge variant="outline">B2B</Badge>}
                            {o.item_type === "flash_sale" && <Badge variant="outline" className="border-accent text-accent">⚡</Badge>}
                            <Badge className={statusColor(o.status)}>{o.status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{toEur(Number(o.total_price))} {t("common.lv")} • {o.payment_method === "card" ? t("checkout.payCard") : t("checkout.payCash")}</p>
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
