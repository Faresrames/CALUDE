import { z } from "zod";

const filename = z.string().min(1).max(200).regex(/^[^/\\\0]+$/);

export const uploadsBody = z.object({ files: z.array(z.object({ name: filename })).min(1).max(50) });

export const photosBody = z.object({
  photos: z.array(z.object({
    originalFilename: filename,
    previewKey: z.string().max(300),
    thumbKey: z.string().max(300),
    width: z.number().int().positive().max(20000),
    height: z.number().int().positive().max(20000),
    bytes: z.number().int().nonnegative().max(50 * 1024 * 1024),
    folder: z.string().max(60).nullish(),
  })).min(1).max(50),
});

export const reopenBody = z.object({ deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish() });
export const selectionBody = z.object({ selected: z.boolean().optional(), favorited: z.boolean().optional() })
  .refine((b) => b.selected !== undefined || b.favorited !== undefined);
export const commentBody = z.object({ photoId: z.string().uuid().nullish(), body: z.string().trim().min(1).max(2000) });
export const unlockBody = z.object({ password: z.string().max(200).optional() });
