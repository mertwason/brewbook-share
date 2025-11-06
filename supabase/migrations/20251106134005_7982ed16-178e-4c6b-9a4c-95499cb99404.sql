-- Kullanıcı profilleri tablosu
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_permission BOOLEAN DEFAULT false,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profil oluşturulduğunda otomatik trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies for profiles
CREATE POLICY "Herkes profilleri görebilir"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Kahve tarifleri tablosu
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_created_at ON public.recipes(created_at DESC);

-- RLS policies for recipes
CREATE POLICY "Herkes tarifleri görebilir"
  ON public.recipes FOR SELECT
  USING (true);

CREATE POLICY "Kullanıcılar tarif oluşturabilir"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi tariflerini güncelleyebilir"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi tariflerini silebilir"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Takip sistemi tablosu
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- RLS policies for follows
CREATE POLICY "Herkes takipleri görebilir"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Kullanıcılar takip edebilir"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Kullanıcılar takibi bırakabilir"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Beğeniler tablosu
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(recipe_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_likes_recipe ON public.likes(recipe_id);
CREATE INDEX idx_likes_user ON public.likes(user_id);

-- RLS policies for likes
CREATE POLICY "Herkes beğenileri görebilir"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Kullanıcılar beğenebilir"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar beğenisini geri alabilir"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);