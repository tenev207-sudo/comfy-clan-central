import { supabase } from "@/integrations/supabase/client";

export async function uploadProductImage(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("Upload error:", error);
    return null;
  }
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
