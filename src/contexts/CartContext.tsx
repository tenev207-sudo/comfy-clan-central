import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export interface Product {
  id: string;
  name: string;
  shop: string;
  old_price: number;
  new_price: number;
  discount: string;
  expiry_date: string;
  image_url: string | null;
  category: string | null;
  description: string | null;
  stock: number;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  user: User | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products:product_id(*)")
      .eq("user_id", user.id);
    if (!error && data) {
      setItems(
        data.map((row: any) => ({
          id: row.id,
          product_id: row.product_id,
          quantity: row.quantity,
          product: row.products as Product,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product: Product) => {
    if (!user) {
      toast({ title: "Моля, влезте в акаунта си", description: "Трябва да сте логнати, за да добавяте продукти в количката.", variant: "destructive" });
      return;
    }
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      await updateQuantity(product.id, existing.quantity + 1);
      return;
    }
    const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
    if (error) {
      toast({ title: "Грешка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Добавено! 🛒", description: `${product.name} е добавен в количката.` });
    await fetchCart();
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
    toast({ title: "Премахнато", description: "Продуктът е премахнат от количката." });
    await fetchCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) { await removeFromCart(productId); return; }
    await supabase.from("cart_items").update({ quantity }).eq("user_id", user.id).eq("product_id", productId);
    await fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.product.new_price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, total, addToCart, removeFromCart, updateQuantity, clearCart, loading, user }}>
      {children}
    </CartContext.Provider>
  );
};
