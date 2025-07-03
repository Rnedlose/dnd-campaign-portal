import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "16MB" } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
    
  campaignFile: f({
    pdf: { maxFileSize: "64MB" },
    image: { maxFileSize: "16MB" },
    text: { maxFileSize: "1MB" },
    "application/pdf": { maxFileSize: "64MB" }
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
