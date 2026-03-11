import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Leaf, Wallet, Barcode, Package, ArrowRight, Clock, MapPin, Phone, Mail, ChevronRight, Map } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

const Index = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const { t, lang } = useI18n();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("surprise_boxes").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(6);
      if (data) setBoxes(data);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block rounded-full bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
              {t("hero.badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
              {t("hero.title1")}<br />
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("hero.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/buyer">
                <Button size="lg" className="gap-2 text-base">
                  <ShoppingBag className="h-5 w-5" /> {t("hero.browse")}
                </Button>
              </Link>
              <Link to="/partners">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  <Leaf className="h-5 w-5" /> {t("hero.partner")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("why.title")}</h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: <ShoppingBag className="h-8 w-8 text-primary" />, title: t("why.business.title"), desc: t("why.business.desc") },
              { icon: <Leaf className="h-8 w-8 text-primary" />, title: t("why.eco.title"), desc: t("why.eco.desc") },
              { icon: <Wallet className="h-8 w-8 text-primary" />, title: t("why.economy.title"), desc: t("why.economy.desc") },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Surprise Boxes */}
      <section id="offers" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("offers.title")}</h2>
              <p className="text-muted-foreground mt-2">{t("offers.desc")}</p>
            </div>
            <Link to="/buyer" className="hidden md:flex">
              <Button variant="ghost" className="gap-1 text-primary">
                {t("offers.viewAll")} <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {boxes.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              {lang === "bg" ? "Все още няма surprise boxes. Следете за нови оферти!" : "No surprise boxes yet. Stay tuned for new offers!"}
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border hover:border-primary/30">
                    <div className="bg-gradient-to-r from-primary to-accent h-32 flex items-center justify-center">
                      <ShoppingBag className="h-14 w-14 text-primary-foreground" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-foreground">{b.title}</h3>
                        <span className="text-xs bg-accent text-accent-foreground font-bold px-2 py-1 rounded-full">{b.quantity} {t("buyer.left")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{b.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="h-3 w-3" /> {b.shop_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs line-through text-muted-foreground mr-1">{Number(b.original_value).toFixed(2)}</span>
                          <span className="text-lg font-bold text-primary">{Number(b.price).toFixed(2)} {t("common.lv")}</span>
                        </div>
                        <Link to="/buyer">
                          <Button size="sm">{t("buyer.reserve")}</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/buyer">
              <Button variant="outline" className="gap-1">
                {t("offers.viewAllOffers")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Merchants */}
      <section id="merchants" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t("merchants.badge")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-foreground">{t("merchants.title")}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{t("merchants.desc")}</p>
              <div className="space-y-6">
                {[
                  { icon: <Barcode className="h-5 w-5" />, title: t("merchants.scan.title"), desc: t("merchants.scan.desc") },
                  { icon: <Package className="h-5 w-5" />, title: t("merchants.control.title"), desc: t("merchants.control.desc") },
                  { icon: <ShoppingBag className="h-5 w-5" />, title: t("merchants.pickup.title"), desc: t("merchants.pickup.desc") },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">{f.icon}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/auth">
                <Button size="lg" className="mt-8 gap-2">{t("merchants.register")} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card className="shadow-2xl border-0 overflow-hidden">
                <div className="bg-primary p-4 text-primary-foreground">
                  <p className="font-bold text-lg">SmartBiteMerchant</p>
                  <p className="text-primary-foreground/70 text-sm">{t("seller.title")}</p>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <Barcode className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-sm text-foreground">{t("seller.scanBarcode")}</p>
                    <p className="text-xs text-muted-foreground">{lang === "bg" ? "Добави продукт за 30 сек." : "Add a product in 30 sec."}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Map className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("map.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("map.desc")}</p>
            <Link to="/map">
              <Button size="lg" variant="outline" className="gap-2">
                <MapPin className="h-5 w-5" /> {lang === "bg" ? "Отвори картата" : "Open Map"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="text-xl font-bold mb-3 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" /> SmartBiteSZ
              </Link>
              <p className="text-background/60 text-sm leading-relaxed mt-3">{t("footer.desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t("footer.forUsers")}</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><a href="/#how-it-works" className="hover:text-background transition-colors">{t("nav.howItWorks")}</a></li>
                <li><Link to="/buyer" className="hover:text-background transition-colors">{t("footer.products")}</Link></li>
                <li><Link to="/map" className="hover:text-background transition-colors">{t("nav.map")}</Link></li>
                <li><Link to="/delivery" className="hover:text-background transition-colors">{t("footer.delivery")}</Link></li>
                <li><Link to="/faq" className="hover:text-background transition-colors">{t("footer.faq")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t("footer.forBusiness")}</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><Link to="/partners" className="hover:text-background transition-colors">{t("footer.partner")}</Link></li>
                <li><Link to="/auth" className="hover:text-background transition-colors">{t("footer.sellerLogin")}</Link></li>
                <li><Link to="/terms" className="hover:text-background transition-colors">{t("footer.terms")}</Link></li>
                <li><Link to="/privacy" className="hover:text-background transition-colors">{t("footer.privacy")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t("footer.contacts")}</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {lang === "bg" ? "гр. Стара Загора" : "Stara Zagora, Bulgaria"}</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@smartbitesz.bg</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +359 88 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm text-background/40">
            © 2024 SmartBite SZ. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
