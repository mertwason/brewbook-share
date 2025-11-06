import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface RecipeCardProps {
  recipe: {
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
  };
  currentUserId?: string;
}

const RecipeCard = ({ recipe, currentUserId }: RecipeCardProps) => {
  const [likesCount, setLikesCount] = useState(recipe.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!currentUserId) return;

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("recipe_id", recipe.id)
          .eq("user_id", currentUserId);
        setLikesCount((prev) => prev - 1);
        setIsLiked(false);
      } else {
        await supabase
          .from("likes")
          .insert({ recipe_id: recipe.id, user_id: currentUserId });
        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Beğeni işlemi başarısız oldu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          {recipe.profiles.avatar_url ? (
            <img
              src={recipe.profiles.avatar_url}
              alt={recipe.profiles.first_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            {recipe.profiles.first_name} {recipe.profiles.last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(recipe.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </p>
        </div>
      </div>

      {recipe.media_type === "image" ? (
        <img
          src={recipe.media_url}
          alt={recipe.title}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <video
          src={recipe.media_url}
          controls
          className="w-full aspect-square object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${isLiked ? "fill-accent text-accent" : ""}`}
            />
            <span className="text-sm font-semibold">{likesCount}</span>
          </button>
        </div>

        <h3 className="font-bold text-lg text-foreground mb-1">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-muted-foreground text-sm">{recipe.description}</p>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
