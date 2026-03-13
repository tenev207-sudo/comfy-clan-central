import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ShoppingBag } from "lucide-react";
import { useCart, type Product } from "@/contexts/CartContext";
import { toEur } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailDialog = ({ product, open, onOpenChange }: Props) => {
  const { addToCart } = useCart();

  if (!product) return null;

  const timeLeft = formatDistanceToNow(new Date(product.expiry_date), { addSuffix: true, locale: bg });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {product.image_url && (
          <div className="relative h-56 bg-muted">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-full">
              {product.discount}
            </span>
          </div>
        )}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">{product.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {product.shop}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Изтича {timeLeft}</span>
            </DialogDescription>
          </DialogHeader>

          {product.description && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <span className="text-sm line-through text-muted-foreground">{toEur(Number(product.old_price))} €</span>
            <span className="text-2xl font-bold text-primary">{toEur(Number(product.new_price))} €</span>
          </div>

          <p className="text-xs text-muted-foreground mt-2">Налични: {product.stock} бр.</p>

          <Button
            className="w-full mt-6 gap-2"
            size="lg"
            onClick={async () => {
              await addToCart(product);
              onOpenChange(false);
            }}
          >
            <ShoppingBag className="h-5 w-5" /> Добави в количката
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
