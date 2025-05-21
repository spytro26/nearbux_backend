"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopRouter = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.shopRouter = express_1.default.Router();
exports.shopRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password, phoneNumber } = req.body;
    const user = zod_1.z.object({
        name: zod_1.z.string().min(3).max(100),
        username: zod_1.z.string(),
        password: zod_1.z.string().min(5).max(16)
    });
    const bul = user.safeParse(req.body);
    if (!bul.success) {
        // bul.error.errors
        return res.status(400).json({ message: "invalid input" });
    }
    ;
    try {
        const already = yield index_1.prisma.shopKeeper.findFirst({
            where: {
                phone: phoneNumber
            }
        });
        if (already) {
            return res.status(400).json({ message: "phone number already registered" });
        }
    }
    catch (e) {
        console.error("error " + e);
    }
    ;
    try {
        const already = yield index_1.prisma.shopKeeper.findFirst({
            where: {
                username
            }
        });
        if (already) {
            return res.status(400).json({ message: "username already taken " });
        }
    }
    catch (e) {
        console.error("error " + e);
    }
    try {
        const hashedpass = yield bcrypt_1.default.hash(password, 3);
        yield index_1.prisma.shopKeeper.create({
            data: {
                name: name,
                username: username,
                password: hashedpass,
                phone: phoneNumber,
            }
        });
        console.log("user signed up");
        res.status(200).json({
            message: "you are succesfully signed up ",
        });
    }
    catch (e) {
        res.json({
            message: "an error while hashing the password ",
        });
    }
}));
exports.shopRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userInput, password } = req.body;
    let foundUser = null;
    console.log(userInput, password);
    if (userInput.length < 9) {
        foundUser = yield index_1.prisma.shopKeeper.findUnique({
            where: {
                username: userInput,
            }
        });
    }
    else {
        foundUser = yield index_1.prisma.shopKeeper.findUnique({
            where: {
                phone: userInput,
            }
        });
    }
    if (!foundUser) {
        return res.status(500).json({ message: "user not found" });
    }
    const validpass = yield bcrypt_1.default.compare(password, foundUser.password);
    if (!validpass) {
        return res.status(500).json({ message: "invalid password" });
    }
    ;
    const jwt_pass = process.env.buis_secret;
    if (!jwt_pass) {
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: foundUser.id }, jwt_pass);
    res.status(200).json({ token });
}));
exports.shopRouter.post("/validate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, phoneNumber } = req.body;
    try {
        const alreadyUsername = yield index_1.prisma.shopKeeper.findFirst({ where: {
                username
            } });
        if (alreadyUsername) {
            return res.status(200).json({ usernameExists: true, phoneExists: false });
        }
        const alreadyPhone = yield index_1.prisma.shopKeeper.findFirst({
            where: {
                phone: phoneNumber
            }
        });
        if (alreadyPhone) {
            return res.status(200).json({ usernameExists: false, phoneExists: true });
        }
        return res.status(200).json({ usernameExists: false, phoneExists: false });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({ message: "error while validating" });
    }
}));
exports.shopRouter.post("/updatepass", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, newPassword } = req.body;
    const already = yield index_1.prisma.shopKeeper.findFirst({
        where: {
            phone: phoneNumber
        }
    });
    if (already) {
        try {
            const hash = yield bcrypt_1.default.hash(newPassword, 3);
            yield index_1.prisma.shopKeeper.update({
                // @ts-ignore
                where: {
                    //@ts-ignore
                    phone: phoneNumber,
                },
                data: {
                    password: hash,
                },
            });
            console.log("db updated");
            return res.status(200).json({ message: "password updated succefully" });
        }
        catch (e) {
            console.log("error while updating db" + e.message);
        }
        ;
    }
    else {
        return res.status(400).json({ messsage: "user not found " });
    }
}));
exports.shopRouter.post("/id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    let keeper;
    try {
        keeper = yield index_1.prisma.shopKeeper.findFirst({
            where: {
                phone: phone,
            }
        });
    }
    catch (e) {
        console.log(e);
    }
    return res.status(200).json({ message: keeper === null || keeper === void 0 ? void 0 : keeper.id });
}));
exports.shopRouter.post("/info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopName, tagline, pin, localArea, coinValue, ownerId } = req.body;
    try {
        const shop = yield index_1.prisma.shop.create({
            data: {
                name: shopName,
                tagline,
                pin,
                localArea,
                value: coinValue,
                ownerId,
            }
        });
        return res.status(200).json({ message: "added succefully", id: shop.id });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({ message: "error while adding info" });
    }
}));
