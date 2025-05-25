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
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const index_1 = require("./index");
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises")); // Use promise-based fs
dotenv_1.default.config();
const router = express_1.default.Router();
// Multer config with 5MB limit
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
cloudinary_1.v2.config({
    cloud_name: 'dvjcznll3',
    api_key: '229598794516194',
    api_secret: process.env.image_upload_key,
});
//@ts-ignore
router.post('/upload-image', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filePath = ''; // Track for cleanup
    try {
        if (!req.file) {
            console.error(' No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        filePath = req.file.path;
        const { productId, shopId, adverId } = req.body;
        // Check if file actually exists on disk
        const fileExists = yield promises_1.default.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) {
            console.error('File not found on server:', filePath);
            return res.status(400).json({ error: 'File not found on server' });
        }
        // Upload to Cloudinary
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            public_id: `shop_product_${Date.now()}`,
        });
        const imageUrl = result.secure_url;
        console.log(imageUrl);
        // hehe
        if (productId) {
            console.log("into the prodcutId");
            yield index_1.prisma.product.update({
                where: { id: parseInt(productId) },
                data: { image: imageUrl },
            });
        }
        ;
        if (shopId) {
            console.log("into the shopId");
            yield index_1.prisma.shop.update({
                where: { id: parseInt(shopId) },
                data: { image: imageUrl },
            });
        }
        ;
        if (adverId) {
            console.log("into the adverId");
            yield index_1.prisma.adver.update({
                where: { id: parseInt(adverId) },
                data: { image: imageUrl },
            });
        }
        ;
        yield promises_1.default.unlink(filePath);
        res.status(200).json({ imageUrl });
    }
    catch (error) {
        console.error(' Upload failed:', error);
        if (filePath) {
            try {
                yield promises_1.default.unlink(filePath);
            }
            catch (unlinkErr) {
                console.error(' Failed to delete temp file:', unlinkErr);
            }
        }
        res.status(500).json({ error: 'Image upload failed', details: error });
    }
}));
exports.default = router;
