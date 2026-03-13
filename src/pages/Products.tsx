import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart, type Product } from "@/contexts/CartContext";
import { toEur } from "@/lib/utils";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (data) setProducts(data as Product[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Всички оферти</h1>
            <p className="text-muted-foreground mt-1">Разгледай всички налични спасявания в Стара Загора</p>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const timeLeft = formatDistanceToNow(new Date(p.expiry_date), { addSuffix: true, locale: bg });
              return (
                <Card key={p.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border hover:border-primary/30">
                  <div className="relative h-44 bg-muted overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(p)}>
                    {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                    <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full">{p.discount}</span>
                    <span className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-xs px-2.5 py-1 rounded-full flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {timeLeft}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.shop}</p>
                    <h3 className="font-semibold text-sm text-foreground mb-3 line-clamp-2 cursor-pointer hover:text-primary" onClick={() => setSelectedProduct(p)}>{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs line-through text-muted-foreground mr-2">{toEur(Number(p.old_price))} €</span>
                        <span className="text-lg font-bold text-primary">{toEur(Number(p.new_price))} €</span>
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
        )}
      </div>

      <ProductDetailDialog product={selectedProduct} open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)} />
    </div>
  );
};

export default Products;
