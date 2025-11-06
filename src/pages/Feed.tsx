import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import RecipeCard from "@/components/RecipeCard";
import BottomNav from "@/components/BottomNav";
import { Coffee } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
    bio: string | null;
  };
  likes: { id: string }[];
}

const Feed = () => {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user]);

  const fetchFeed = async () => {
    try {
      // Takip edilen kullanıcıların ID'lerini al
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user?.id);

      const followingIds = followsData?.map((f) => f.following_id) || [];
      
      // Kendi ID'mizi de ekleyelim
      if (user?.id) followingIds.push(user.id);

      // Tarifleri çek
      const { data, error } = await supabase
        .from("recipes")
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            bio
          ),
          likes (id)
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Feed yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Coffee className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <h1 className="text-2xl font-bold text-foreground">Ana Sayfa</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Henüz takip ettiğiniz kişilerden tarif yok.
              <br />
              Keşfet sayfasından yeni insanları keşfedin!
            </p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} currentUserId={user?.id} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;
