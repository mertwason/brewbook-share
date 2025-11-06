import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Coffee } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  firstName: z.string().min(2, "İsim en az 2 karakter olmalı"),
  lastName: z.string().min(2, "Soyisim en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  contactPermission: z.boolean(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactPermission: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        const validation = signUpSchema.safeParse(formData);
        if (!validation.success) {
          toast({
            title: "Hata",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              contact_permission: formData.contactPermission,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Başarılı!",
          description: "Hesabınız oluşturuldu. Giriş yapabilirsiniz.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-cream p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-soft p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-coffee flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Kahve Tarifleri</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Hoş geldiniz!" : "Yeni hesap oluştur"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="firstName">İsim</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Soyisim</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          {!isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contactPermission"
                checked={formData.contactPermission}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, contactPermission: checked as boolean })
                }
              />
              <Label htmlFor="contactPermission" className="text-sm">
                İletişim izni veriyorum
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Yükleniyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline text-sm"
          >
            {isLogin ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
