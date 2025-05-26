"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const user_1 = require("./routes/user");
const shopkeeper_1 = require("./routes/shopkeeper");
const client_1 = require("@prisma/client");
const upload_1 = __importDefault(require("./upload"));
exports.prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/user", user_1.userRouter);
app.use("/shop", shopkeeper_1.shopRouter);
app.use("/api", upload_1.default);
app.get("/", (req, res) => {
    res.json({ active: "active" });
});
const port = process.env.port;
console.log("service running on port " + port);
app.listen(3000);
