import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).default("Untitled document"),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").max(200).optional(),
    content: z.string().max(2_000_000).optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "Provide a title or content to update",
  });

export const shareDocumentSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  permission: z.enum(["VIEW", "EDIT"]).default("VIEW"),
});

export const loginSchema = z.object({
  userId: z.string().min(1),
});

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB
export const SUPPORTED_UPLOAD_EXTENSIONS = [".txt", ".md"] as const;
