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
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.userRouter = express_1.default.Router();
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("request arrived");
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
    console.log("before try");
    try {
        const already = yield index_1.prisma.user.findFirst({
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
        const already = yield index_1.prisma.user.findFirst({
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
        yield index_1.prisma.user.create({
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
    console.log(username, name, password, phoneNumber);
    console.log(typeof (username), typeof (name), typeof (password), typeof (phoneNumber));
}));
exports.userRouter.get("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("request arrived");
    res.status(400).json({ message: "hiihi" });
}));
exports.userRouter.post("/validate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, phoneNumber } = req.body;
    try {
        const alreadyUsername = yield index_1.prisma.user.findFirst({ where: {
                username
            } });
        if (alreadyUsername) {
            return res.status(200).json({ usernameExists: true, phoneExists: false });
        }
        const alreadyPhone = yield index_1.prisma.user.findFirst({
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
        return res.status(400).json({ message: "error while validating" });
    }
}));
exports.userRouter.post("/info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, area, pinCode } = req.body;
    if (!phoneNumber || !area || !pinCode) {
        return res.status(400).json({ message: "invalid request" });
    }
    try {
        const existingUser = yield index_1.prisma.user.findUnique({
            where: {
                phone: phoneNumber,
            },
        });
        if (!existingUser) {
            return res.status(400).json({ message: "User not found with this phone number." });
        }
        const updatedUser = yield index_1.prisma.user.update({
            where: {
                phone: phoneNumber,
            },
            data: {
                local_area: area,
                pin: pinCode,
            },
        });
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: "Something went wrong", error });
    }
}));
let c = 0;
exports.userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    c = c + 1;
    console.log('hitted' + c + "times");
    const { userInput, password } = req.body;
    let foundUser = null;
    console.log(userInput, password);
    if (userInput.length < 9) {
        foundUser = yield index_1.prisma.user.findFirst({
            where: {
                // @ts-ignore
                username: userInput,
            }
        });
    }
    else {
        foundUser = yield index_1.prisma.user.findFirst({
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
    const jwt_pass = process.env.user_secret;
    if (!jwt_pass) {
        return;
    }
    const token = jsonwebtoken_1.default.sign({ phone: foundUser.phone }, jwt_pass);
    res.json({ token });
}));
