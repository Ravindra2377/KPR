"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = __importDefault(require("mime-types"));
const client_s3_1 = require("@aws-sdk/client-s3");
const User_1 = __importDefault(require("../src/models/User"));
const s3_client_1 = require("../src/utils/s3-client");
dotenv_1.default.config();
const uploadsDir = path_1.default.join(process.cwd(), "uploads", "profile");
const resolveLocalPath = (url) => {
    if (!url)
        return null;
    const relative = url.replace(/^\/+/, "");
    return path_1.default.join(process.cwd(), relative);
};
const getContentType = (filePath) => {
    const ext = path_1.default.extname(filePath);
    return mime_types_1.default.contentType(ext) || "application/octet-stream";
};
const uploadFile = async (localPath, key) => {
    const buffer = await fs_extra_1.default.readFile(localPath);
    const contentType = getContentType(localPath);
    await s3_client_1.s3.send(new client_s3_1.PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "private"
    }));
    return (0, s3_client_1.buildPublicUrl)(key);
};
const migrate = async () => {
    await mongoose_1.default.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kpr");
    const users = await User_1.default.find({});
    console.log(`Migrating ${users.length} users`);
    for (const user of users) {
        try {
            if (user.banner?.url?.startsWith("/uploads/profile")) {
                const localPath = resolveLocalPath(user.banner.url);
                if (localPath && (await fs_extra_1.default.pathExists(localPath))) {
                    const key = path_1.default.posix.join(String(user._id), "banner", `${Date.now()}-${path_1.default.basename(localPath)}`);
                    const url = await uploadFile(localPath, key);
                    user.banner = {
                        key,
                        url,
                        uploadedAt: new Date()
                    };
                    console.log(`  migrated banner for ${user._id}`);
                    await fs_extra_1.default.remove(localPath);
                }
            }
            if (user.portfolio?.length) {
                for (let i = 0; i < user.portfolio.length; i++) {
                    const item = user.portfolio[i];
                    if (item.url?.startsWith("/uploads/profile")) {
                        const localPath = resolveLocalPath(item.url);
                        if (localPath && (await fs_extra_1.default.pathExists(localPath))) {
                            const key = path_1.default.posix.join(String(user._id), "portfolio", `${Date.now()}-${i}-${path_1.default.basename(localPath)}`);
                            const url = await uploadFile(localPath, key);
                            item.key = key;
                            item.url = url;
                            item.uploadedAt = new Date();
                            item.meta = item.meta || {};
                            console.log(`  migrated portfolio ${i} for ${user._id}`);
                            await fs_extra_1.default.remove(localPath);
                        }
                    }
                }
            }
            await user.save();
        }
        catch (err) {
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
