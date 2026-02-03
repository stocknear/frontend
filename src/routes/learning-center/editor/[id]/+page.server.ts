import { fail, redirect } from "@sveltejs/kit";

export const load = async ({ locals, params }) => {
  const { pb } = locals;
  const { id } = params;

  // Get article if editing (not "new")
  const getArticle = async () => {
    if (id === "new") {
      return null;
    }

    try {
      const article = await pb.collection("tutorials").getOne(id);
      return article;
    } catch (error) {
      console.error("Error fetching article:", error);
      throw redirect(303, "/learning-center/editor");
    }
  };

  return {
    article: await getArticle(),
    isNew: id === "new",
  };
};

export const actions = {
  // Save article (create or update)
  saveArticle: async ({ request, locals, params }) => {
    const { pb } = locals;
    const { id } = params;
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const abstract = formData.get("abstract") as string;
    const description = formData.get("description") as string;
    const tagsRaw = formData.get("tags") as string;
    const cover = formData.get("cover") as File | null;
    const removeCover = formData.get("removeCover") === "true";

    // Parse tags - can be JSON array or comma-separated string
    let tags: string[] = [];
    try {
      tags = JSON.parse(tagsRaw || "[]");
    } catch {
      tags = tagsRaw?.split(",").filter(Boolean) || [];
    }

    if (!title) {
      return fail(400, { error: "Title is required" });
    }

    try {
      const articleData: any = {
        title,
        abstract,
        description,
        tags, // PocketBase select field accepts array
      };

      // Handle cover image
      if (removeCover) {
        articleData.cover = null;
      } else if (cover && cover.size > 0) {
        articleData.cover = cover;
      }

      let article;
      if (id === "new") {
        // Create new article
        article = await pb.collection("tutorials").create(articleData);
      } else {
        // Update existing article
        article = await pb.collection("tutorials").update(id, articleData);
      }

      return { success: true, articleId: article.id };
    } catch (error) {
      console.error("Error saving article:", error);
      return fail(500, { error: "Failed to save article" });
    }
  },

  // Upload image for content (inline images)
  uploadImage: async ({ request, locals, params }) => {
    const { pb } = locals;
    const { id } = params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return fail(400, { error: "No file provided" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return fail(400, { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return fail(400, { error: "File too large. Maximum size is 5MB." });
    }

    try {
      let articleId = id;
      let article;

      // If this is a new article, create it first with minimal data
      if (id === "new") {
        article = await pb.collection("tutorials").create({
          title: "Untitled",
          images: [file],
        });
        articleId = article.id;
      } else {
        // Append image to existing article's images array
        article = await pb.collection("tutorials").update(id, {
          "images+": file,
        });
      }

      // Get the filename of the uploaded image (last one in the array)
      const images = article.images || [];
      const uploadedFileName = images[images.length - 1];
      
      // Build the image URL
      const pbUrl = import.meta.env.VITE_IMAGE_POCKETBASE_URL || "http://localhost:8090";
      let imageUrl;
      
      if (pbUrl === "http://localhost:8090") {
        imageUrl = `${pbUrl}/api/files/${article.collectionId}/${article.id}/${uploadedFileName}`;
      } else {
        imageUrl = `${pbUrl}/${article.collectionId}/${article.id}/${uploadedFileName}`;
      }
      
      return { success: true, url: imageUrl, articleId: article.id };
    } catch (error) {
      console.error("Error uploading image:", error);
      return fail(500, { error: "Failed to upload image" });
    }
  },
};
