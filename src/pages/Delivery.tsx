import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Delivery = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <Link to="/"><Button variant="ghost" size="sm" className="gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Начало</Button></Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Доставка и плащане</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>Информация за начините на доставка и плащане ще бъде публикувана тук скоро.</p>
        <p>За въпроси, свържете се с нас на <span className="text-primary">hello@smartbitesz.bg</span></p>
      </div>
    </div>
  </div>
);

export default Delivery;
