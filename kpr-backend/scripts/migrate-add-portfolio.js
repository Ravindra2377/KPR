"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../src/models/User"));
dotenv_1.default.config();
async function run() {
    await mongoose_1.default.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kpr");
    const users = await User_1.default.find({});
    for (const user of users) {
        if (!user.portfolio)
            user.portfolio = [];
        if (!user.portfolioOrder)
            user.portfolioOrder = [];
        await user.save();
    }
    console.log("Migration complete");
    process.exit(0);
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
