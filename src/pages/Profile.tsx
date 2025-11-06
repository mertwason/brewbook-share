import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import RecipeCard from "@/components/RecipeCard";
import { LogOut, Coffee, User as UserIcon } from "lucide-react";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  created_at: string;
  profiles: Profile;
  likes: { id: string }[];
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
      fetchUserRecipes(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Profil yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecipes = async (userId: string) => {
    try {
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
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Tarifler yüklenirken hata:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Çıkış yapıldı",
      description: "Başarıyla çıkış yaptınız.",
    });
    navigate("/auth");
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
      <header className="bg-gradient-coffee px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary-foreground">Profil</h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profil"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-foreground">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-primary-foreground/80">{profile?.email}</p>
              <p className="text-primary-foreground/60 text-sm mt-1">
                {recipes.length} tarif
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz tarif paylaşmadınız.</p>
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

export default Profile;
