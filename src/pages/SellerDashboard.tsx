import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, QrCode, ShoppingBag, Trash2, CheckCircle, Database } from "lucide-react";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import BarcodeScanner from "@/components/BarcodeScanner";

const SellerDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [productCodes, setProductCodes] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddBox, setShowAddBox] = useState(false);
  const [showAddCode, setShowAddCode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  // Product form
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pOldPrice, setPOldPrice] = useState("");
  const [pNewPrice, setPNewPrice] = useState("");
  const [pStock, setPStock] = useState("1");
  const [pExpiry, setPExpiry] = useState("");
  const [pBarcode, setPBarcode] = useState("");

  // Box form
  const [bTitle, setBTitle] = useState("");
  const [bDesc, setBDesc] = useState("");
  const [bPrice, setBPrice] = useState("");
  const [bOrigVal, setBOrigVal] = useState("");
  const [bQty, setBQty] = useState("1");
  const [bPickupStart, setBPickupStart] = useState("");
  const [bPickupEnd, setBPickupEnd] = useState("");

  // Code form
  const [cBarcode, setCBarcode] = useState("");
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cOldPrice, setCOldPrice] = useState("");
  const [cNewPrice, setCNewPrice] = useState("");
  const [cCategory, setCCategory] = useState("general");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (!roles?.some((r: any) => r.role === "seller")) { navigate("/role"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single();
      setProfile(prof);
    };
    init();
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const [prodRes, boxRes, ordRes, codeRes] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", userId).order("created_at", { ascending: false }),
      supabase.from("surprise_boxes").select("*").eq("seller_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("seller_id", userId).order("created_at", { ascending: false }),
      supabase.from("product_codes" as any).select("*").eq("seller_id", userId).order("created_at", { ascending: false }),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (boxRes.data) setBoxes(boxRes.data);
    if (ordRes.data) setOrders(ordRes.data);
    if (codeRes.data) setProductCodes(codeRes.data as any[]);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddProduct = async () => {
    if (!userId || !pName || !pOldPrice || !pNewPrice || !pExpiry) return;
    const discount = Math.round((1 - parseFloat(pNewPrice) / parseFloat(pOldPrice)) * 100);
    const { error } = await supabase.from("products").insert({
      seller_id: userId,
      name: pName,
      description: pDesc,
      old_price: parseFloat(pOldPrice),
      new_price: parseFloat(pNewPrice),
      discount: `-${discount}%`,
      stock: parseInt(pStock),
      expiry_date: new Date(pExpiry).toISOString(),
      shop: profile?.shop_name || "My Shop",
      is_active: true,
    });
    if (error) { toast({ title: t("auth.error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅", description: t("seller.addProduct") });
    setShowAddProduct(false);
    setPName(""); setPDesc(""); setPOldPrice(""); setPNewPrice(""); setPStock("1"); setPExpiry(""); setPBarcode("");
    fetchData();
  };

  const handleAddBox = async () => {
    if (!userId || !bTitle || !bPrice || !bOrigVal || !bPickupStart || !bPickupEnd) return;
    const { error } = await supabase.from("surprise_boxes").insert({
      seller_id: userId,
      title: bTitle,
      description: bDesc,
      price: parseFloat(bPrice),
      original_value: parseFloat(bOrigVal),
      quantity: parseInt(bQty),
      pickup_start: new Date(bPickupStart).toISOString(),
      pickup_end: new Date(bPickupEnd).toISOString(),
      shop_name: profile?.shop_name || "My Shop",
      shop_address: profile?.shop_address || "",
      is_active: true,
    });
    if (error) { toast({ title: t("auth.error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅", description: t("seller.addBox") });
    setShowAddBox(false);
    setBTitle(""); setBDesc(""); setBPrice(""); setBOrigVal(""); setBQty("1"); setBPickupStart(""); setBPickupEnd("");
    fetchData();
  };

  const handleAddCode = async () => {
    if (!userId || !cBarcode || !cName) return;
    const { error } = await supabase.from("product_codes" as any).insert({
      seller_id: userId,
      barcode: cBarcode,
      name: cName,
      description: cDesc || null,
      old_price: parseFloat(cOldPrice) || 0,
      new_price: parseFloat(cNewPrice) || 0,
      category: cCategory,
    } as any);
    if (error) { toast({ title: t("auth.error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅", description: t("seller.codeAdded") });
    setShowAddCode(false);
    setCBarcode(""); setCName(""); setCDesc(""); setCOldPrice(""); setCNewPrice(""); setCCategory("general");
    fetchData();
  };

  const handleDeleteCode = async (id: string) => {
    await supabase.from("product_codes" as any).delete().eq("id", id);
    fetchData();
  };

  const handleBarcodeScan = async (code: string) => {
    setShowScanner(false);
    // Check if barcode exists in seller's product_codes table
    const match = productCodes.find((c: any) => c.barcode === code);
    if (match) {
      setPBarcode(code);
      setPName(match.name);
      setPDesc(match.description || "");
      setPOldPrice(String(match.old_price || ""));
      setPNewPrice(String(match.new_price || ""));
      setShowAddProduct(true);
      toast({ title: t("seller.codeFound"), description: match.name });
    } else {
      setPBarcode(code);
      setPName(`Product ${code}`);
      setShowAddProduct(true);
      toast({ title: "Barcode scanned", description: `Code: ${code}` });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  const handleDeleteBox = async (id: string) => {
    await supabase.from("surprise_boxes").delete().eq("id", id);
    fetchData();
  };

  const handleOrderStatus = async (orderId: string, status: "pending" | "paid" | "ready" | "picked_up" | "expired" | "refunded") => {
    await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    fetchData();
    toast({ title: "✅", description: `Order updated to ${status}` });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-500/10 text-yellow-700";
      case "paid": return "bg-blue-500/10 text-blue-700";
      case "ready": return "bg-primary/10 text-primary";
      case "picked_up": return "bg-green-500/10 text-green-700";
      case "expired": return "bg-destructive/10 text-destructive";
      case "refunded": return "bg-muted text-muted-foreground";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("seller.title")}</h1>
              <p className="text-muted-foreground">{profile?.shop_name}</p>
            </div>
            <div className="flex gap-2">
              <DeleteAccountButton />
              <Button variant="outline" onClick={() => setShowScanner(true)} className="gap-2">
                <QrCode className="h-4 w-4" /> {t("seller.scanBarcode")}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger value="products" className="gap-1"><Package className="h-4 w-4" /> {t("seller.products")}</TabsTrigger>
              <TabsTrigger value="boxes" className="gap-1"><ShoppingBag className="h-4 w-4" /> {t("seller.boxes")}</TabsTrigger>
              <TabsTrigger value="orders" className="gap-1"><CheckCircle className="h-4 w-4" /> {t("seller.orders")}</TabsTrigger>
              <TabsTrigger value="codes" className="gap-1"><Database className="h-4 w-4" /> {t("seller.productCodes")}</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="flex justify-end mb-4">
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="h-4 w-4" /> {t("seller.addProduct")}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t("seller.addProduct")}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      {pBarcode && <p className="text-sm text-muted-foreground">{t("seller.barcode")}: {pBarcode}</p>}
                      <div><Label>{t("auth.name")}</Label><Input value={pName} onChange={(e) => setPName(e.target.value)} /></div>
                      <div><Label>Description</Label><Input value={pDesc} onChange={(e) => setPDesc(e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Old Price</Label><Input type="number" value={pOldPrice} onChange={(e) => setPOldPrice(e.target.value)} /></div>
                        <div><Label>New Price</Label><Input type="number" value={pNewPrice} onChange={(e) => setPNewPrice(e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Stock</Label><Input type="number" value={pStock} onChange={(e) => setPStock(e.target.value)} /></div>
                        <div><Label>Expiry Date</Label><Input type="datetime-local" value={pExpiry} onChange={(e) => setPExpiry(e.target.value)} /></div>
                      </div>
                      <Button className="w-full" onClick={handleAddProduct}>{t("common.save")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {products.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("seller.noProducts")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-sm text-muted-foreground">{p.discount} • {Number(p.new_price).toFixed(2)} {t("common.lv")} • {p.stock} {t("common.pieces")}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Boxes Tab */}
            <TabsContent value="boxes">
              <div className="flex justify-end mb-4">
                <Dialog open={showAddBox} onOpenChange={setShowAddBox}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="h-4 w-4" /> {t("seller.addBox")}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t("seller.addBox")}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Title</Label><Input value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Surprise Box" /></div>
                      <div><Label>Description</Label><Input value={bDesc} onChange={(e) => setBDesc(e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Price</Label><Input type="number" value={bPrice} onChange={(e) => setBPrice(e.target.value)} /></div>
                        <div><Label>Original Value</Label><Input type="number" value={bOrigVal} onChange={(e) => setBOrigVal(e.target.value)} /></div>
                      </div>
                      <div><Label>Quantity</Label><Input type="number" value={bQty} onChange={(e) => setBQty(e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Pickup Start</Label><Input type="datetime-local" value={bPickupStart} onChange={(e) => setBPickupStart(e.target.value)} /></div>
                        <div><Label>Pickup End</Label><Input type="datetime-local" value={bPickupEnd} onChange={(e) => setBPickupEnd(e.target.value)} /></div>
                      </div>
                      <Button className="w-full" onClick={handleAddBox}>{t("common.save")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {boxes.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("seller.noBoxes")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {boxes.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{b.title}</p>
                          <p className="text-sm text-muted-foreground">{Number(b.price).toFixed(2)} {t("common.lv")} • {b.quantity} {t("common.pieces")}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBox(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              {orders.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("seller.noOrders")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <Card key={o.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{o.order_number}</p>
                            <p className="text-sm text-muted-foreground">Pickup code: <span className="font-mono font-bold text-primary">{o.pickup_code}</span></p>
                          </div>
                          <Badge className={statusColor(o.status)}>{o.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{Number(o.total_price).toFixed(2)} {t("common.lv")} • {o.payment_method}</p>
                        <div className="flex gap-2 mt-3">
                          {o.status === "paid" && (
                            <Button size="sm" onClick={() => handleOrderStatus(o.id, "ready")}>{t("seller.markReady")}</Button>
                          )}
                          {o.status === "ready" && (
                            <Button size="sm" onClick={() => handleOrderStatus(o.id, "picked_up")}>{t("seller.markPickedUp")}</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Product Codes Tab */}
            <TabsContent value="codes">
              <div className="flex justify-end mb-4">
                <Dialog open={showAddCode} onOpenChange={setShowAddCode}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="h-4 w-4" /> {t("seller.addCode")}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t("seller.addCode")}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>{t("seller.barcode")}</Label><Input value={cBarcode} onChange={(e) => setCBarcode(e.target.value)} placeholder="1234567890123" /></div>
                      <div><Label>{t("auth.name")}</Label><Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Product name" /></div>
                      <div><Label>Description</Label><Input value={cDesc} onChange={(e) => setCDesc(e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Old Price</Label><Input type="number" value={cOldPrice} onChange={(e) => setCOldPrice(e.target.value)} /></div>
                        <div><Label>New Price</Label><Input type="number" value={cNewPrice} onChange={(e) => setCNewPrice(e.target.value)} /></div>
                      </div>
                      <div><Label>Category</Label><Input value={cCategory} onChange={(e) => setCCategory(e.target.value)} /></div>
                      <Button className="w-full" onClick={handleAddCode}>{t("common.save")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {productCodes.length > 0
                  ? "When you scan a barcode that matches a code below, the product form will auto-fill."
                  : t("seller.noCodes")}
              </p>

              {productCodes.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">{t("seller.noCodes")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {productCodes.map((c: any) => (
                    <Card key={c.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{c.barcode}</p>
                          <p className="text-sm text-muted-foreground">
                            {Number(c.old_price).toFixed(2)} → {Number(c.new_price).toFixed(2)} {t("common.lv")}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCode(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("seller.scanBarcode")}</DialogTitle></DialogHeader>
          <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;
