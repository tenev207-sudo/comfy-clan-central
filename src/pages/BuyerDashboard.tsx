import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Package, ClipboardList, MapPin, Clock, CreditCard, Banknote, Trash2, ShoppingCart, Store, Zap, Users, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
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

  useEffect(() => {
    const channel = supabase
      .channel("flash-sales-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "flash_sales" }, (payload) => {
        const newSale = payload.new as any;
        setFlashNotification(newSale);
        setFlashSales((prev) => [newSale, ...prev]);
        setTimeout(() => setFlashNotification(null), 10000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addToSelection = (item: any, type: "surprise_box" | "product" | "flash_sale") => {
    if (selectedItems.find(s => s.id === item.id)) {
      toast({ title: t("buyer.alreadyAdded"), description: t("buyer.alreadyAddedDesc") });
      return;
    }
    const newItem: SelectedItem = {
      id: item.id, type,
      title: type === "surprise_box" ? item.title : (type === "flash_sale" ? item.title : item.name),
      shop: type === "surprise_box" ? item.shop_name : (type === "flash_sale" ? item.shop_name : item.shop),
      price: type === "surprise_box" ? item.price : (type === "flash_sale" ? item.flash_price : item.new_price),
      data: item,
    };
    setSelectedItems(prev => [...prev, newItem]);
    setCartOpen(true);
    toast({ title: "✅", description: `${newItem.title} ${t("buyer.addedToCart")}` });
  };

  const removeFromSelection = (id: string) => setSelectedItems(prev => prev.filter(s => s.id !== id));
  const totalPrice = selectedItems.reduce((sum, s) => sum + Number(s.price), 0);

  const handleConfirmOrder = async () => {
    if (!userId || selectedItems.length === 0) return;
    setLoading(true);
    try {
      for (const item of selectedItems) {
        const sellerId = item.data.seller_id;
        if (!sellerId) throw new Error("Seller not found");
        const { error } = await supabase.from("orders").insert({
          buyer_id: userId, seller_id: sellerId, item_type: item.type, item_id: item.id,
          quantity: 1, total_price: item.price,
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
    } finally { setLoading(false); }
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

  const handleShopClick = (shopName: string) => { setFilterShop(shopName); setActiveTab("products"); };

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
      if (nearby.length === 0) continue;
      const group = [seller, ...nearby];
      group.forEach(s => used.add(s.user_id));
      const groupProducts = products.filter(p =>
        group.some(s => p.seller_id === s.user_id || p.shop === s.shop_name) && p.stock > 0
      );
      if (groupProducts.length === 0) continue;
      bundles.push({
        id: group.map(s => s.user_id).join("-"), shops: group, products: groupProducts,
        totalOldPrice: groupProducts.reduce((sum, p) => sum + Number(p.old_price), 0),
        totalNewPrice: groupProducts.reduce((sum, p) => sum + Number(p.new_price), 0),
        centerAddress: seller.shop_address || seller.shop_name || "Nearby shops",
      });
    }
    return bundles;
  })();

  const handleReserveBundle = (bundle: StreetBundle) => { bundle.products.forEach(p => addToSelection(p, "product")); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Flash Sale Notification Banner */}
      <AnimatePresence>
        {flashNotification && (
          <motion.div
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
            className="fixed top-16 left-0 right-0 z-50 px-4 pt-2"
          >
            <div className="container mx-auto max-w-lg">
              <Card className="border-2 border-accent bg-accent/5 shadow-lg">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground text-sm truncate">{t("flash.new")} {flashNotification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {flashNotification.shop_name} • {toEur(Number(flashNotification.flash_price))} €
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs h-7 px-2" onClick={() => {
                      addToSelection(flashNotification, "flash_sale");
                      setFlashNotification(null);
                    }}>
                      {t("flash.grab")}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setFlashNotification(null)}>✕</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("buyer.title")}</h1>
            <div className="flex items-center gap-2">
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-1.5"><Settings className="h-4 w-4" /> Настройки</Button>
              </Link>
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 relative">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("buyer.mySelection")}</span>
                    {selectedItems.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {selectedItems.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col">
                  <SheetHeader>
                    <SheetTitle>{t("buyer.mySelection")} ({selectedItems.length})</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                    {selectedItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{t("buyer.emptySelection")}</p>
                      </div>
                    ) : (
                      selectedItems.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-3 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.shop}</p>
                              <p className="text-sm font-bold text-primary mt-0.5">{toEur(Number(item.price))} €</p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeFromSelection(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="border-t border-border pt-4 mt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground text-sm">{t("checkout.total")}:</span>
                        <span className="text-lg font-bold text-primary">{toEur(totalPrice)} €</span>
                      </div>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                        <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <RadioGroupItem value="card" id="card-pay" />
                          <Label htmlFor="card-pay" className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                            <CreditCard className="h-4 w-4 text-primary" /> {t("checkout.payCard")}
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <RadioGroupItem value="cash" id="cash-pay" />
                          <Label htmlFor="cash-pay" className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                            <Banknote className="h-4 w-4 text-primary" /> {t("checkout.payCash")}
                          </Label>
                        </div>
                      </RadioGroup>
                      <Button className="w-full" onClick={handleConfirmOrder} disabled={loading}>
                        {loading ? t("auth.loading") : t("checkout.confirm")}
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "markets") setFilterShop(null); }}>
            <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="markets" className="gap-1 text-xs sm:text-sm"><Store className="h-3.5 w-3.5" /> {t("buyer.allMarkets")}</TabsTrigger>
              <TabsTrigger value="products" className="gap-1 text-xs sm:text-sm"><Package className="h-3.5 w-3.5" /> {t("buyer.products")}</TabsTrigger>
              <TabsTrigger value="boxes" className="gap-1 text-xs sm:text-sm"><ShoppingBag className="h-3.5 w-3.5" /> {t("buyer.surpriseBoxes")}</TabsTrigger>
              <TabsTrigger value="flash" className="gap-1 text-xs sm:text-sm relative">
                <Zap className="h-3.5 w-3.5" /> Flash
                {flashSales.length > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] inline-flex items-center justify-center">
                    {flashSales.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bundles" className="gap-1 text-xs sm:text-sm"><Users className="h-3.5 w-3.5" /> Bundles</TabsTrigger>
              <TabsTrigger value="orders" className="gap-1 text-xs sm:text-sm"><ClipboardList className="h-3.5 w-3.5" /> {t("buyer.myOrders")}</TabsTrigger>
            </TabsList>

            {/* Markets Tab */}
            <TabsContent value="markets">
              {sellers.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noProducts")}</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sellers.map((s) => {
                    const shopProducts = products.filter(p => p.seller_id === s.user_id || p.shop === s.shop_name);
                    const shopBoxes = boxes.filter(b => b.seller_id === s.user_id || b.shop_name === s.shop_name);
                    const totalItems = shopProducts.length + shopBoxes.length;
                    return (
                      <motion.div key={s.user_id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full" onClick={() => handleShopClick(s.shop_name!)}>
                          <div className="bg-gradient-to-r from-primary to-accent h-16 flex items-center justify-center">
                            <Store className="h-7 w-7 text-primary-foreground" />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-bold text-foreground text-sm truncate">{s.shop_name}</h3>
                            {s.shop_address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="h-3 w-3 shrink-0" /> {s.shop_address}
                              </p>
                            )}
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">{totalItems} items</Badge>
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
                  <Badge variant="outline" className="text-xs px-2 py-1">{filterShop}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setFilterShop(null)}>{t("buyer.allProducts")}</Button>
                </div>
              )}
              {filteredProducts.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noProducts")}</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProducts.map((p) => (
                    <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-28 sm:h-36 object-cover" />
                      ) : (
                        <div className="w-full h-28 sm:h-36 bg-muted flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground truncate mb-0.5">{p.shop}</p>
                        <h3 className="font-semibold text-foreground text-sm truncate mb-2">{p.name}</h3>
                        <div className="flex items-end justify-between gap-1">
                          <div>
                            <span className="text-[10px] line-through text-muted-foreground block">{toEur(Number(p.old_price))} €</span>
                            <span className="text-sm font-bold text-primary">{toEur(Number(p.new_price))} €</span>
                          </div>
                          <Button size="sm" className="h-7 text-xs px-2" onClick={() => addToSelection(p, "product")} disabled={p.stock <= 0}>
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
                  <Badge variant="outline" className="text-xs px-2 py-1">{filterShop}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setFilterShop(null)}>{t("buyer.allProducts")}</Button>
                </div>
              )}
              {filteredBoxes.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("buyer.noBoxes")}</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredBoxes.map((b) => (
                    <motion.div key={b.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        {b.image_url ? (
                          <img src={b.image_url} alt={b.title} className="w-full h-28 sm:h-36 object-cover" />
                        ) : (
                          <div className="bg-gradient-to-r from-primary to-accent h-28 sm:h-36 flex items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-primary-foreground" />
                          </div>
                        )}
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="font-bold text-foreground text-sm truncate">{b.title}</h3>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{b.quantity}</Badge>
                          </div>
                          {b.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{b.description}</p>}
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" /> {b.shop_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Clock className="h-3 w-3 shrink-0" /> {format(new Date(b.pickup_start), "HH:mm")} - {format(new Date(b.pickup_end), "HH:mm")}
                          </p>
                          <div className="flex items-end justify-between gap-1">
                            <div>
                              <span className="text-[10px] line-through text-muted-foreground block">{toEur(Number(b.original_value))} €</span>
                              <span className="text-sm font-bold text-primary">{toEur(Number(b.price))} €</span>
                            </div>
                            <Button size="sm" className="h-7 text-xs px-2" onClick={() => addToSelection(b, "surprise_box")} disabled={b.quantity <= 0}>
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
              {flashSales.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("flash.noItems")}</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {flashSales.map((f: any) => (
                    <motion.div key={f.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
                      <Card className="overflow-hidden border-2 border-accent/40 hover:border-accent transition-colors">
                        <div className="bg-gradient-to-r from-accent to-accent/60 p-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-accent-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-accent-foreground text-sm truncate">{f.title}</p>
                            <p className="text-xs text-accent-foreground/80 truncate">{f.shop_name}</p>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          {f.description && <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{f.description}</p>}
                          {f.shop_address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {f.shop_address}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Clock className="h-3 w-3 shrink-0" /> {format(new Date(f.expires_at), "HH:mm")}
                          </p>
                          <div className="flex items-end justify-between gap-1">
                            <div>
                              <span className="text-[10px] line-through text-muted-foreground block">{toEur(Number(f.original_price))} €</span>
                              <span className="text-sm font-bold text-accent">{toEur(Number(f.flash_price))} €</span>
                            </div>
                            <Button size="sm" className="h-7 text-xs px-2 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => addToSelection(f, "flash_sale")} disabled={f.quantity <= 0}>
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

            {/* Community Bundles Tab */}
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
                          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-primary shrink-0" />
                              <h3 className="font-bold text-foreground text-sm">{t("bundle.title")}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {bundle.centerAddress}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">{bundle.shops.length} {t("bundle.shops")}</Badge>
                              <Badge variant="secondary" className="text-xs">{bundle.products.length} {t("bundle.items")}</Badge>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <div className="space-y-1.5 mb-3">
                              {bundle.products.slice(0, 3).map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-xs gap-2">
                                  <span className="text-foreground truncate">{p.name}</span>
                                  <span className="font-semibold text-primary shrink-0">{toEur(Number(p.new_price))} €</span>
                                </div>
                              ))}
                              {bundle.products.length > 3 && (
                                <p className="text-xs text-muted-foreground">+{bundle.products.length - 3} more...</p>
                              )}
                            </div>
                            <div className="border-t border-border pt-2 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Save <span className="font-bold text-primary">{toEur(savings)} €</span></p>
                                <p className="text-sm font-bold text-foreground">{toEur(bundle.totalNewPrice)} €</p>
                              </div>
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleReserveBundle(bundle)}>
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
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-foreground text-sm truncate">{o.order_number}</p>
                          <div className="flex gap-1 shrink-0">
                            {o.item_type === "b2b" && <Badge variant="outline" className="text-xs">B2B</Badge>}
                            {o.item_type === "flash_sale" && <Badge variant="outline" className="border-accent text-accent text-xs">⚡</Badge>}
                            <Badge className={`${statusColor(o.status)} text-xs`}>{o.status}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{toEur(Number(o.total_price))} € • {o.payment_method === "card" ? t("checkout.payCard") : t("checkout.payCash")}</p>
                        {(o.status === "paid" || o.status === "ready") && (
                          <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-center">
                            <p className="text-xs text-muted-foreground">{t("buyer.pickupCode")}</p>
                            <p className="text-xl font-mono font-bold text-primary tracking-wider">{o.pickup_code}</p>
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
