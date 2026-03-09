import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Leaf, Wallet, Barcode, Settings2, Truck, ArrowRight, Clock, MapPin, Phone, Mail, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const offers = [
  { discount: "-50%", expiry: "Изтича днес", shop: 'Пекарна "Златен Клас"', name: "Пакет занаятчийски хляб и закуски (Излишък)", oldPrice: "12.00 лв.", newPrice: "6.00 лв.", img: "🍞" },
  { discount: "-40%", expiry: "Годно до утре", shop: 'Супермаркет "Свежест"', name: "Микс свежи зеленчуци (2 кг) - Нестандартни", oldPrice: "8.50 лв.", newPrice: "5.10 лв.", img: "🥦" },
  { discount: "-60%", expiry: "Изтича след 2 дни", shop: 'Магазин "Млечен Път"', name: "Кашкавал от краве мляко (400 гр)", oldPrice: "11.90 лв.", newPrice: "4.76 лв.", img: "🧀" },
  { discount: "-30%", expiry: "Изтича днес", shop: 'Ресторант "Азия"', name: 'Суши сет "Сьомга" (12 хапки) - от обедно меню', oldPrice: "18.00 лв.", newPrice: "12.60 лв.", img: "🍣" },
];

const Index = () => {
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
            <Button size="lg" className="gap-2 text-base">
              <ShoppingBag className="h-5 w-5" /> Разгледай офертите
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base">
              <Leaf className="h-5 w-5" /> Стани партньор
            </Button>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-16 md:py-24 bg-muted/50">
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Актуални спасявания</h2>
              <p className="text-muted-foreground mt-2">Експресна доставка до 45 минути в рамките на Стара Загора.</p>
            </div>
            <Button variant="ghost" className="hidden md:flex gap-1 text-primary">
              Виж всички <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offers.map((o, i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border hover:border-primary/30">
                <div className="relative h-44 bg-muted flex items-center justify-center text-6xl">
                  {o.img}
                  <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    {o.discount}
                  </span>
                  <span className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-xs px-2.5 py-1 rounded-full flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {o.expiry}
                  </span>
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {o.shop}
                  </p>
                  <h3 className="font-semibold text-sm text-foreground mb-3 line-clamp-2">{o.name}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs line-through text-muted-foreground mr-2">{o.oldPrice}</span>
                      <span className="text-lg font-bold text-primary">{o.newPrice}</span>
                    </div>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-primary/30 hover:bg-primary hover:text-primary-foreground">
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Button variant="outline" className="gap-1">
              Виж всички оферти <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* For Merchants */}
      <section className="py-16 md:py-24 bg-muted/50">
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
              <Button size="lg" className="mt-8 gap-2">
                Регистрирай своя магазин <ArrowRight className="h-4 w-4" />
              </Button>
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
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" /> SmartBiteSZ
              </h3>
              <p className="text-background/60 text-sm leading-relaxed">
                Първият дигитален хипермаркет за спасена храна в Стара Загора.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">За Потребители</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li>Как работи</li><li>Разгледай продукти</li><li>Доставка и плащане</li><li>ЧЗВ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">За Бизнеса</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li>Стани партньор</li><li>Вход за търговци</li><li>Условия за ползване</li><li>Свържи се</li>
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
    </div>
  );
};

export default Index;
