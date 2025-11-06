import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import RecipeCard from "@/components/RecipeCard";
import BottomNav from "@/components/BottomNav";
import { Search, Coffee } from "lucide-react";
import { Input } from "@/components/ui/input";

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

const Explore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
    fetchAllRecipes();
  }, [searchQuery]);

  const fetchAllRecipes = async () => {
    try {
      let query = supabase
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
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Tarifler yüklenirken hata:", error);
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
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Keşfet</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tarif ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "Aradığınız tarif bulunamadı."
                : "Henüz hiç tarif paylaşılmamış."}
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

export default Explore;
