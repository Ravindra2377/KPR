import dotenv from "dotenv";
import fs from "fs-extra";
import mongoose from "mongoose";
import path from "path";
import mime from "mime-types";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import User from "../src/models/User";
import { s3, buildPublicUrl } from "../src/utils/s3-client";

dotenv.config();

const uploadsDir = path.join(process.cwd(), "uploads", "profile");

const resolveLocalPath = (url?: string) => {
  if (!url) return null;
  const relative = url.replace(/^\/+/, "");
  return path.join(process.cwd(), relative);
};

const getContentType = (filePath: string) => {
  const ext = path.extname(filePath);
  return mime.contentType(ext) || "application/octet-stream";
};

const uploadFile = async (localPath: string, key: string) => {
  const buffer = await fs.readFile(localPath);
  const contentType = getContentType(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "private"
    })
  );
  return buildPublicUrl(key);
};

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kpr");
  const users = await User.find({});
  console.log(`Migrating ${users.length} users`);

  for (const user of users) {
    try {
      if (user.banner?.url?.startsWith("/uploads/profile")) {
        const localPath = resolveLocalPath(user.banner.url!);
        if (localPath && (await fs.pathExists(localPath))) {
          const key = path.posix.join(String(user._id), "banner", `${Date.now()}-${path.basename(localPath)}`);
          const url = await uploadFile(localPath, key);
          user.banner = {
            key,
            url,
            uploadedAt: new Date()
          } as any;
          console.log(`  migrated banner for ${user._id}`);
          await fs.remove(localPath);
        }
      }

      if (user.portfolio?.length) {
        for (let i = 0; i < user.portfolio.length; i++) {
          const item = user.portfolio[i];
          if (item.url?.startsWith("/uploads/profile")) {
            const localPath = resolveLocalPath(item.url);
            if (localPath && (await fs.pathExists(localPath))) {
              const key = path.posix.join(String(user._id), "portfolio", `${Date.now()}-${i}-${path.basename(localPath)}`);
              const url = await uploadFile(localPath, key);
              item.key = key;
              item.url = url;
              item.uploadedAt = new Date();
              item.meta = item.meta || {};
              console.log(`  migrated portfolio ${i} for ${user._id}`);
              await fs.remove(localPath);
            }
          }
        }
      }

      await user.save();
    } catch (err) {
      console.error(`failed to migrate user ${user._id}`, err);
    }
  }

  console.log("Migration complete");
  process.exit(0);
};

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});