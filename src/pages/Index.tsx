import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Leaf, Wallet, Barcode, Settings2, Truck, ArrowRight, Clock, MapPin, Phone, Mail, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type Product } from "@/contexts/CartContext";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(4);
      if (data) setProducts(data as Product[]);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="inline-block rounded-full bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
            Дигитален хипермаркет в Стара Загора
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            Спаси вкусна храна.<br />
            <span className="text-primary">Спести до 70%.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Купувай качествени продукти от местни супермаркети и пекарни с наближаващ срок на годност. Експресна термо-доставка директно до твоята врата.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="gap-2 text-base">
                <ShoppingBag className="h-5 w-5" /> Разгледай офертите
              </Button>
            </Link>
            <Link to="/partners">
              <Button size="lg" variant="outline" className="gap-2 text-base">
                <Leaf className="h-5 w-5" /> Стани партньор
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Защо го правим?</h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: <ShoppingBag className="h-8 w-8 text-primary" />, title: "Загуби за бизнеса", desc: "Локални търговци изхвърлят тонове годна храна поради липса на канал за бърза разпродажба в края на деня." },
              { icon: <Leaf className="h-8 w-8 text-primary" />, title: "Екологична криза", desc: "Органичният отпадък в депото край Ракитница отделя метан – основен фактор за климатичните промени." },
              { icon: <Wallet className="h-8 w-8 text-primary" />, title: "Икономически натиск", desc: "Потребителите в Стара Загора търсят начини да оптимизират разходите си за храна без компромис в качеството." },
            ].map((item, i) => (
              <Card key={i} className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Offers */}
      <section id="offers" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Актуални спасявания</h2>
              <p className="text-muted-foreground mt-2">Експресна доставка до 45 минути в рамките на Стара Загора.</p>
            </div>
            <Link to="/products" className="hidden md:flex">
              <Button variant="ghost" className="gap-1 text-primary">
                Виж всички <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const timeLeft = formatDistanceToNow(new Date(p.expiry_date), { addSuffix: true, locale: bg });
              return (
                <Card key={p.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border hover:border-primary/30">
                  <div className="relative h-44 bg-muted overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(p)}>
                    {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                    <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                      {p.discount}
                    </span>
                    <span className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-xs px-2.5 py-1 rounded-full flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {timeLeft}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.shop}
                    </p>
                    <h3 className="font-semibold text-sm text-foreground mb-3 line-clamp-2 cursor-pointer hover:text-primary" onClick={() => setSelectedProduct(p)}>{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs line-through text-muted-foreground mr-2">{Number(p.old_price).toFixed(2)} лв.</span>
                        <span className="text-lg font-bold text-primary">{Number(p.new_price).toFixed(2)} лв.</span>
                      </div>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-primary/30 hover:bg-primary hover:text-primary-foreground" onClick={() => addToCart(p)}>
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link to="/products">
              <Button variant="outline" className="gap-1">
                Виж всички оферти <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Merchants */}
      <section id="merchants" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">За Търговци</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-foreground">Продавайте излишъка, вместо да го изхвърляте.</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Управлението на продукти с наближаващ срок никога не е било толкова лесно. Въведете продукт за под 30 секунди и генерирайте приходи от стока, която иначе би била загуба.
              </p>
              <div className="space-y-6">
                {[
                  { icon: <Barcode className="h-5 w-5" />, title: "Автоматично попълване", desc: "Сканирате баркода с телефона. Системата автоматично извлича име, марка, грамаж и добавя стокова снимка." },
                  { icon: <Settings2 className="h-5 w-5" />, title: "Пълен контрол на цените", desc: "Вие решавате каква отстъпка да предложите. Без автоматични алгоритми, които да подбиват маржа ви." },
                  { icon: <Truck className="h-5 w-5" />, title: "Нулева логистика за вас", desc: "Лицензирани куриери с термо-чанти вземат поръчката директно от обекта ви." },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/partners">
                <Button size="lg" className="mt-8 gap-2">
                  Регистрирай своя магазин <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mock merchant dashboard */}
            <div className="relative">
              <Card className="shadow-2xl border-0 overflow-hidden">
                <div className="bg-primary p-4 text-primary-foreground">
                  <p className="font-bold text-lg">SmartBiteMerchant</p>
                  <p className="text-primary-foreground/70 text-sm">Панел за управление</p>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Дневни продажби</p>
                    <p className="text-2xl font-bold text-foreground">124.50 лв.</p>
                    <p className="text-xs text-primary mt-1">↑ +12% от спасена храна</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <Barcode className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-sm text-foreground">Сканирай Баркод</p>
                    <p className="text-xs text-muted-foreground">Добави продукт за 30 сек.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Активни продукти (3)</p>
                    {[
                      { name: "Прясно мляко Верея 3%", price: "-50% (1.50 лв.)", qty: "2 бр." },
                      { name: "Сандвич Шунка и Кашкавал", price: "-30% (2.80 лв.)", qty: "5 бр." },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                        <div className="w-10 h-10 bg-muted rounded-lg" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-primary">{p.price}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.qty}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
              <p className="text-background/60 text-sm leading-relaxed mt-3">
                Първият дигитален хипермаркет за спасена храна в Стара Загора.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">За Потребители</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><a href="/#how-it-works" className="hover:text-background transition-colors">Как работи</a></li>
                <li><Link to="/products" className="hover:text-background transition-colors">Разгледай продукти</Link></li>
                <li><Link to="/delivery" className="hover:text-background transition-colors">Доставка и плащане</Link></li>
                <li><Link to="/faq" className="hover:text-background transition-colors">ЧЗВ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">За Бизнеса</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><Link to="/partners" className="hover:text-background transition-colors">Стани партньор</Link></li>
                <li><Link to="/auth" className="hover:text-background transition-colors">Вход за търговци</Link></li>
                <li><Link to="/terms" className="hover:text-background transition-colors">Условия за ползване</Link></li>
                <li><Link to="/privacy" className="hover:text-background transition-colors">Поверителност</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Контакти</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> гр. Стара Загора</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@smartbitesz.bg</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +359 88 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm text-background/40">
            © 2024 SmartBite SZ. Всички права запазени.
          </div>
        </div>
      </footer>

      <ProductDetailDialog product={selectedProduct} open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)} />
    </div>
  );
};

export default Index;
