import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Upload } from "lucide-react";
import { z } from "zod";

const recipeSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalı").max(100),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir"),
  mediaUrl: z.string().url("Geçerli bir URL girin"),
});

const NewRecipe = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    mediaType: "image" as "image" | "video",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = recipeSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: "Hata",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("recipes").insert({
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        media_url: formData.mediaUrl,
        media_type: formData.mediaType,
      });

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Tarifiniz paylaşıldı.",
      });
      navigate("/");
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Yeni Tarif</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Tarif Başlığı</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Örn: Karamelli Frappuccino"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tarifinizin detaylarını yazın..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="mediaType">Medya Tipi</Label>
            <select
              id="mediaType"
              value={formData.mediaType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mediaType: e.target.value as "image" | "video",
                })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
            >
              <option value="image">Fotoğraf</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <Label htmlFor="mediaUrl">Medya URL</Label>
            <Input
              id="mediaUrl"
              type="url"
              value={formData.mediaUrl}
              onChange={(e) =>
                setFormData({ ...formData, mediaUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Şu an için harici URL desteklenmektedir. Gelecekte dosya yükleme
              özelliği eklenecek.
            </p>
          </div>

          {formData.mediaUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              {formData.mediaType === "image" ? (
                <img
                  src={formData.mediaUrl}
                  alt="Önizleme"
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <video
                  src={formData.mediaUrl}
                  controls
                  className="w-full aspect-square object-cover"
                />
              )}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <Upload className="w-5 h-5" />
            {loading ? "Paylaşılıyor..." : "Paylaş"}
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default NewRecipe;
