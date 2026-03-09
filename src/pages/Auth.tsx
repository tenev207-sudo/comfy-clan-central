import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Невалиден имейл адрес").max(255),
  password: z.string().min(6, "Паролата трябва да е поне 6 символа").max(128),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(1, "Моля, въведете име").max(100),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const schema = isLogin ? loginSchema : registerSchema;
    const parsed = schema.safeParse({ email, password, ...(isLogin ? {} : { displayName }) });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Успешен вход!", description: "Добре дошли обратно." });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: displayName } },
        });
        if (error) throw error;
        toast({ title: "Регистрацията е успешна!", description: "Проверете имейла си за потвърждение." });
      }
    } catch (err: any) {
      toast({ title: "Грешка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-foreground mb-2">
            <Leaf className="h-7 w-7 text-primary" /> SmartBiteSZ
          </Link>
          <p className="text-muted-foreground text-sm">Спаси храна, спести пари</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{isLogin ? "Вход" : "Регистрация"}</CardTitle>
            <CardDescription>
              {isLogin ? "Влезте в своя акаунт" : "Създайте нов акаунт"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Име</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Вашето име" className="pl-10" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Имейл</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Парола</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Зареждане..." : isLogin ? "Вход" : "Регистрация"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-sm text-primary hover:underline">
                {isLogin ? "Нямате акаунт? Регистрирайте се" : "Вече имате акаунт? Влезте"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Обратно към началната страница
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
