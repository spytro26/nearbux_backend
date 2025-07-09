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
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
const cron = require('node-cron');
app.use(express_1.default.json());
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
    if (userInput.length < 10) {
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
    ;
    let shopId;
    try {
        shopId = yield index_1.prisma.shop.findFirst({
            where: {
                ownerId: foundUser.id
            },
            select: {
                id: true
            }
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "shopId not found" });
    }
    ;
    if (!shopId) {
        return res.json({ message: "error while getting shopId" });
    }
    const token = jsonwebtoken_1.default.sign({ id: foundUser.id, shopId: shopId === null || shopId === void 0 ? void 0 : shopId.id }, jwt_pass);
    res.status(200).json({ token, shopId: shopId.id, ownerId: foundUser.id });
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
    const { shopName, tagline, pin, localArea, coinValue, ownerId, opens, closes } = req.body;
    try {
        // Validate that opens and closes are provided
        if (!opens || !closes) {
            return res.status(400).json({ message: "Opening and closing times are required" });
        }
        // Convert string dates to Date objects if they're not already
        const openingTime = new Date(opens);
        const closingTime = new Date(closes);
        // Validate that the dates are valid
        if (isNaN(openingTime.getTime()) || isNaN(closingTime.getTime())) {
            return res.status(400).json({ message: "Invalid date format for opening or closing time" });
        }
        // Validate that opening time is before closing time
        if (openingTime >= closingTime) {
            return res.status(400).json({ message: "Opening time must be before closing time" });
        }
        const shop = yield index_1.prisma.shop.create({
            data: {
                name: shopName,
                tagline,
                pin,
                localArea,
                coinValue: parseInt(coinValue), // Fixed: changed from 'value' to 'coinValue' to match schema
                ownerId,
                opens: openingTime,
                closes: closingTime
            }
        });
        return res.status(200).json({ message: "Added successfully", id: shop.id });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({ message: "Error while adding info" });
    }
}));
// Create promotion route
exports.shopRouter.post('/create-promotion', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message, shopId, shopKeeperId } = req.body;
        // Validate required fields
        if (!title || !message || !shopId || !shopKeeperId) {
            return res.status(400).json({
                error: 'Missing required fields: title, message, shopId, and shopKeeperId are required'
            });
        }
        // Validate that the shop exists and belongs to the shopkeeper
        const shop = yield index_1.prisma.shop.findFirst({
            where: {
                id: parseInt(shopId),
            }
        });
        if (!shop) {
            return res.status(404).json({
                error: 'Shop not found or does not belong to this shopkeeper'
            });
        }
        // Create the promotion (Adver record)
        const newPromotion = yield index_1.prisma.adver.create({
            data: {
                title: title.trim(),
                message: message.trim(),
                shopId: parseInt(shopId),
                shopKeeperId: parseInt(shopKeeperId),
                // image will be updated later via the upload-image endpoint
            }
        });
        res.status(201).json({
            success: true,
            message: 'Promotion created successfully',
            adverId: newPromotion.id,
            promotion: newPromotion
        });
    }
    catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({
            error: 'Failed to create promotion',
            details: error.message
        });
    }
}));
exports.shopRouter.get("/promotions/:shopId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const shopId = parseInt(req.params.shopId);
    if (!shopId) {
        return res.status(400).json({ message: "missing shopId" });
    }
    if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid Shop ID" });
    }
    try {
        const promotion = yield index_1.prisma.adver.findFirst({
            where: {
                shopId: shopId,
                // You might have a status field (e.g., 'active') to ensure you fetch only active promotions
                // status: 'active',
            },
            select: {
                title: true,
                message: true,
                image: true,
                views: true,
                clicks: true,
            },
            orderBy: {
                createdAt: 'desc', // Assuming you want the most recent active promotion
            },
        });
        if (promotion) {
            return res.status(200).json(promotion);
        }
        else {
            return res.status(404).json({ message: "No active promotion found for this shop." });
        }
    }
    catch (e) {
        console.error("Error fetching promotion details:", e);
        return res.status(500).json({ message: "Error fetching promotion details" });
    }
}));
// Delete promotion
exports.shopRouter.delete('/delete-promotion/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("delete hitted");
        const { id } = req.params;
        const promotion = yield index_1.prisma.adver.findUnique({
            where: { id: parseInt(id) }
        });
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        yield index_1.prisma.adver.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json({
            success: true,
            message: 'Promotion deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({
            error: 'Failed to delete promotion',
            details: error.message
        });
    }
}));
exports.shopRouter.post("/already", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.body;
    let shop = parseInt(shopId);
    try {
        const present = yield index_1.prisma.adver.findFirst({
            where: {
                shopId: shop
            }
        });
        if (present) {
            return res.status(200).json({ message: 1 });
        }
        else {
            return res.status(200).json({ message: 0 });
        }
    }
    catch (e) {
        console.error(e);
        return res.status(404).json({ error: "error occured while db call" });
    }
}));
exports.shopRouter.post("/orders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.body;
    try {
        const response = yield index_1.prisma.order.findMany({
            where: {
                shopId: parseInt(shopId)
            },
            include: {
                consumer: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                    }
                }
            }
        });
        return res.status(200).json({ message: response });
    }
    catch (e) {
        console.error(e + " error occurred");
        return res.status(502).json({ message: "error while db call" });
    }
}));
exports.shopRouter.put("/orders/update-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, status } = req.body;
    try {
        const updatedOrder = yield index_1.prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status: status }
        });
        return res.status(200).json({ message: "Order status updated", order: updatedOrder });
    }
    catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ error: "Failed to update order status" });
    }
}));
exports.shopRouter.post('/analytics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.body;
        if (!shopId) {
            return res.status(400).json({ error: 'Shop ID is required' });
        }
        // Get date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 1. Get top selling items with total quantities sold (only CONFIRMED and COMPLETED orders)
        const topSellingItems = yield index_1.prisma.order.groupBy({
            by: ['productId'],
            where: {
                shopId: parseInt(shopId),
                status: {
                    in: ['CONFIRMED', 'COMPLETED'],
                },
            },
            _sum: {
                quantity: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            // Show all products instead of limiting to top 10
        });
        // Get product details for the top selling items
        const productIds = topSellingItems.map(item => item.productId);
        const products = yield index_1.prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                name: true,
                price: true,
                image: true,
            },
        });
        // Combine product details with sales data
        const topSellingData = topSellingItems.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                productName: (product === null || product === void 0 ? void 0 : product.name) || 'Unknown Product',
                productImage: product === null || product === void 0 ? void 0 : product.image,
                productPrice: (product === null || product === void 0 ? void 0 : product.price) || 0,
                totalQuantitySold: item._sum.quantity || 0,
                totalOrders: item._count.id || 0,
                totalRevenue: ((product === null || product === void 0 ? void 0 : product.price) || 0) * (item._sum.quantity || 0),
            };
        });
        // 2. Get coins given by the shop in last 30 days
        const coinsGiven = yield index_1.prisma.coin.findMany({
            where: {
                transFrom: parseInt(shopId),
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                volume: true,
                createdAt: true,
                toUser: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // Calculate total coins given (since volume is a string, we need to parse and sum manually)
        const totalCoinsGiven = coinsGiven.reduce((sum, coin) => {
            return sum + (parseInt(coin.volume) || 0);
        }, 0);
        // Get detailed coin transactions for the chart
        const coinTransactions = coinsGiven;
        // 3. Get total accepted orders in last 30 days
        const acceptedOrders = yield index_1.prisma.order.aggregate({
            where: {
                shopId: parseInt(shopId),
                status: {
                    in: ['CONFIRMED', 'COMPLETED'],
                },
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            _count: {
                id: true,
            },
            _sum: {
                quantity: true,
            },
        });
        // Get daily order counts for chart
        const dailyOrders = yield index_1.prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                shopId: parseInt(shopId),
                status: {
                    in: ['CONFIRMED', 'COMPLETED'],
                },
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            _count: {
                id: true,
            },
        });
        // Process daily orders for chart with proper typing
        const ordersByDate = dailyOrders.reduce((acc, order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + order._count.id;
            return acc;
        }, {});
        // Get shop details
        const shopDetails = yield index_1.prisma.shop.findUnique({
            where: {
                id: parseInt(shopId),
            },
            select: {
                id: true,
                name: true,
                rating: true,
                tagline: true,
                image: true,
                localArea: true,
            },
        });
        // Calculate total revenue
        const totalRevenue = topSellingData.reduce((sum, item) => sum + item.totalRevenue, 0);
        // Response data
        const analyticsData = {
            shop: shopDetails,
            summary: {
                totalRevenue,
                totalProductsSold: topSellingData.reduce((sum, item) => sum + item.totalQuantitySold, 0),
                totalOrdersAccepted: acceptedOrders._count.id || 0,
                totalCoinsGiven: totalCoinsGiven,
                totalCoinTransactions: coinsGiven.length,
            },
            topSellingProducts: topSellingData,
            coinTransactions: coinTransactions.map(tx => ({
                amount: parseInt(tx.volume),
                date: tx.createdAt,
                recipientName: tx.toUser.name,
            })),
            dailyOrdersChart: Object.entries(ordersByDate).map(([date, count]) => ({
                date,
                orders: count,
            })),
            last30Days: {
                from: thirtyDaysAgo.toISOString(),
                to: new Date().toISOString(),
            },
        };
        res.status(200).json({
            success: true,
            data: analyticsData,
        });
    }
    catch (error) {
        console.error('Shop analytics error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shop analytics',
            details: errorMessage,
        });
    }
}));
exports.shopRouter.get('/products/:shopId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const shopIdInt = parseInt(shopId);
        if (isNaN(shopIdInt)) {
            return res.status(400).json({
                message: 'Invalid shop ID format'
            });
        }
        const products = yield index_1.prisma.product.findMany({
            where: { shopId: shopIdInt },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            products: products
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            message: 'Failed to fetch products'
        });
    }
}));
// POST /shop/products - Create a new product
exports.shopRouter.post('/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, price, quantity, shopId } = req.body;
        // Validation
        if (!name || !price || !quantity || !shopId) {
            return res.status(400).json({
                message: 'All fields are required: name, price, quantity, shopId'
            });
        }
        const priceInt = parseInt(price);
        const quantityInt = parseInt(quantity);
        const shopIdInt = parseInt(shopId);
        if (isNaN(priceInt) || priceInt < 0) {
            return res.status(400).json({
                message: 'Price must be a valid positive number'
            });
        }
        if (isNaN(quantityInt) || quantityInt < 0) {
            return res.status(400).json({
                message: 'Quantity must be a valid positive number'
            });
        }
        // Create the product
        const newProduct = yield index_1.prisma.product.create({
            data: {
                name: name.trim(),
                price: priceInt,
                quantity: quantityInt,
                shopId: shopIdInt
            }
        });
        res.status(201).json({
            product: newProduct
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            message: 'Failed to add product'
        });
    }
}));
// PUT /shop/products/:productId - Update product price and quantity
exports.shopRouter.put('/products/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const { price, quantity } = req.body;
        const productIdInt = parseInt(productId);
        if (isNaN(productIdInt)) {
            return res.status(400).json({
                message: 'Invalid product ID format'
            });
        }
        const updateData = {};
        if (price !== undefined) {
            const priceInt = parseInt(price);
            if (isNaN(priceInt) || priceInt < 0) {
                return res.status(400).json({
                    message: 'Price must be a valid positive number'
                });
            }
            updateData.price = priceInt;
        }
        if (quantity !== undefined) {
            const quantityInt = parseInt(quantity);
            if (isNaN(quantityInt) || quantityInt < 0) {
                return res.status(400).json({
                    message: 'Quantity must be a valid positive number'
                });
            }
            updateData.quantity = quantityInt;
        }
        // Update the product
        const updatedProduct = yield index_1.prisma.product.update({
            where: { id: productIdInt },
            data: updateData
        });
        res.status(200).json({
            product: updatedProduct
        });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            message: 'Failed to update product'
        });
    }
}));
// DELETE /shop/products/:productId - Delete a product
exports.shopRouter.delete('/products/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const productIdInt = parseInt(productId);
        if (isNaN(productIdInt)) {
            return res.status(400).json({
                message: 'Invalid product ID format'
            });
        }
        // Delete associated cart items first (if any)
        yield index_1.prisma.cart.deleteMany({
            where: { productId: productIdInt }
        });
        // Delete the product
        yield index_1.prisma.product.delete({
            where: { id: productIdInt }
        });
        res.status(200).json({
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            message: 'Failed to delete product'
        });
    }
}));
exports.shopRouter.post('/products/bulk', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { products } = req.body;
        // Validate input
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: 'Products array is required and must contain at least one product'
            });
        }
        // Validate each product
        const validatedProducts = [];
        const errors = [];
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            // Check required fields
            if (!product.name || !product.price || !product.quantity || !product.shopId) {
                errors.push(`Product ${i + 1}: Missing required fields (name, price, quantity, shopId)`);
                continue;
            }
            // Validate data types
            if (typeof product.name !== 'string' || product.name.trim().length === 0) {
                errors.push(`Product ${i + 1}: Name must be a non-empty string`);
                continue;
            }
            if (isNaN(product.price) || product.price <= 0) {
                errors.push(`Product ${i + 1}: Price must be a positive number`);
                continue;
            }
            if (isNaN(product.quantity) || product.quantity < 0) {
                errors.push(`Product ${i + 1}: Quantity must be a non-negative number`);
                continue;
            }
            if (isNaN(product.shopId)) {
                errors.push(`Product ${i + 1}: shopId must be a valid number`);
                continue;
            }
            validatedProducts.push({
                name: product.name.trim(),
                price: parseInt(product.price),
                quantity: parseInt(product.quantity),
                shopId: parseInt(product.shopId),
                canBePurchasedByCoin: product.canBePurchasedByCoin || false
            });
        }
        // If there are validation errors, return them
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation errors',
                errors: errors
            });
        }
        // Check if all shops exist - Fix: Explicitly type the shopIds array
        const shopIds = [...new Set(validatedProducts.map((p) => p.shopId))];
        const existingShops = yield index_1.prisma.shop.findMany({
            where: {
                id: {
                    in: shopIds
                }
            },
            select: {
                id: true
            }
        });
        const existingShopIds = existingShops.map(shop => shop.id);
        const invalidShopIds = shopIds.filter(id => !existingShopIds.includes(id));
        if (invalidShopIds.length > 0) {
            return res.status(404).json({
                message: 'Invalid shop IDs found',
                invalidShopIds: invalidShopIds
            });
        }
        // Check for duplicate product names within the same shop (case-insensitive)
        const duplicateErrors = [];
        // Check for duplicates within the current request
        const productNamesByShop = new Map();
        validatedProducts.forEach((product, index) => {
            const shopId = product.shopId;
            const productName = product.name.toLowerCase();
            if (!productNamesByShop.has(shopId)) {
                productNamesByShop.set(shopId, new Set());
            }
            const shopProducts = productNamesByShop.get(shopId);
            if (shopProducts.has(productName)) {
                duplicateErrors.push(`Product ${index + 1}: Duplicate product name '${product.name}' found in the same shop within this request`);
            }
            else {
                shopProducts.add(productName);
            }
        });
        // Check for existing products in the database with same names (case-insensitive)
        const existingProducts = yield index_1.prisma.product.findMany({
            where: {
                shopId: {
                    in: shopIds
                }
            },
            select: {
                name: true,
                shopId: true
            }
        });
        // Create a map of existing products by shop (case-insensitive)
        const existingProductsByShop = new Map();
        existingProducts.forEach(product => {
            const shopId = product.shopId;
            const productName = product.name.toLowerCase();
            if (!existingProductsByShop.has(shopId)) {
                existingProductsByShop.set(shopId, new Set());
            }
            existingProductsByShop.get(shopId).add(productName);
        });
        // Check if any new products conflict with existing ones
        validatedProducts.forEach((product, index) => {
            const shopId = product.shopId;
            const productName = product.name.toLowerCase();
            const existingShopProducts = existingProductsByShop.get(shopId);
            if (existingShopProducts && existingShopProducts.has(productName)) {
                duplicateErrors.push(`Product ${index + 1}: Product with name '${product.name}' already exists in this shop`);
            }
        });
        if (duplicateErrors.length > 0) {
            return res.status(409).json({
                message: 'Duplicate product names found',
                errors: duplicateErrors
            });
        }
        // Create products using Prisma transaction for data consistency
        const createdProducts = yield index_1.prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            const results = [];
            for (const productData of validatedProducts) {
                const newProduct = yield prisma.product.create({
                    data: productData,
                    include: {
                        shop: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });
                results.push(newProduct);
            }
            return results;
        }));
        res.status(201).json({
            message: `Successfully created ${createdProducts.length} products`,
            products: createdProducts,
            count: createdProducts.length
        });
    }
    catch (error) {
        console.error('Error bulk creating products:', error);
        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return res.status(409).json({
                message: 'Duplicate entry found',
                error: error.message
            });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({
                message: 'Foreign key constraint failed',
                error: error.message
            });
        }
        res.status(500).json({
            message: 'Internal server error while creating products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
}));
exports.shopRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.id);
        const shop = yield index_1.prisma.shop.findUnique({
            where: { id: shopId },
            include: {
                owner: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        return res.json(shop);
    }
    catch (error) {
        console.error('Error fetching shop:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// PUT /shop/:id - Update shop information
exports.shopRouter.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.id);
        const { name, tagline, pin, localArea, coinValue, opens, closes } = req.body;
        const updatedShop = yield index_1.prisma.shop.update({
            where: { id: shopId },
            data: {
                name,
                tagline,
                pin,
                localArea,
                coinValue,
                opens: opens ? new Date(opens) : null,
                closes: closes ? new Date(closes) : null
            },
            include: {
                owner: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });
        return res.json(updatedShop);
    }
    catch (error) {
        console.error('Error updating shop:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// Cron job to reactivate all shops daily (run at midnight)
cron.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield index_1.prisma.shop.updateMany({
            where: { isActive: false },
            data: { isActive: true }
        });
        console.log('All shops reactivated for the new day');
    }
    catch (error) {
        console.error('Error reactivating shops:', error);
    }
}));
// PATCH /shop/:id/toggle-status
exports.shopRouter.patch('/:id/toggle-status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.id);
        // Get current shop status  
        const currentShop = yield index_1.prisma.shop.findUnique({
            where: { id: shopId }
        });
        if (!currentShop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        // Toggle the isActive status
        const updatedShop = yield index_1.prisma.shop.update({
            where: { id: shopId },
            data: {
                isActive: !currentShop.isActive
            },
            include: {
                owner: true
            }
        });
        res.json(updatedShop);
    }
    catch (error) {
        console.error('Error toggling shop status:', error);
        res.status(500).json({ error: 'Failed to toggle shop status' });
    }
}));
// GET /shop/:shopId/products - Fetch all products for a specific shop
exports.shopRouter.get('/:shopId/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        if (isNaN(shopId)) {
            return res.status(400).json({ error: 'Invalid shop ID' });
        }
        const products = yield index_1.prisma.product.findMany({
            where: {
                shopId: shopId
            },
            select: {
                id: true,
                name: true,
                image: true,
                price: true,
                quantity: true,
                canBePurchasedByCoin: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json(products);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /shop/:shopId/update-inventory - Update product quantities after billing
exports.shopRouter.post('/:shopId/update-inventory', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        const { items, ownerId } = req.body;
        if (isNaN(shopId)) {
            return res.status(400).json({ error: 'Invalid shop ID' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }
        if (!ownerId) {
            return res.status(400).json({ error: 'Owner ID is required' });
        }
        // Verify shop ownership
        const shop = yield index_1.prisma.shop.findFirst({
            where: {
                id: shopId,
                ownerId: parseInt(ownerId)
            }
        });
        if (!shop) {
            return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
        }
        // Start transaction to update all products and create orders
        const updatePromises = items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const productId = parseInt(item.productId);
            const quantityToReduce = parseInt(item.quantity);
            if (isNaN(productId) || isNaN(quantityToReduce) || quantityToReduce <= 0) {
                throw new Error(`Invalid product ID or quantity for item: ${JSON.stringify(item)}`);
            }
            // Get current product to check availability
            const currentProduct = yield index_1.prisma.product.findFirst({
                where: {
                    id: productId,
                    shopId: shopId
                }
            });
            if (!currentProduct) {
                throw new Error(`Product with ID ${productId} not found in shop ${shopId}`);
            }
            if (currentProduct.quantity < quantityToReduce) {
                throw new Error(`Insufficient quantity for product ${currentProduct.name}. Available: ${currentProduct.quantity}, Required: ${quantityToReduce}`);
            }
            // Update product quantity
            const updatedProduct = yield index_1.prisma.product.update({
                where: {
                    id: productId
                },
                data: {
                    quantity: currentProduct.quantity - quantityToReduce
                }
            });
            // Create order record for offline sale
            yield index_1.prisma.order.create({
                data: {
                    shopId: shopId,
                    productId: productId,
                    quantity: quantityToReduce,
                    soldOffline: true,
                    status: 'COMPLETED',
                    soldToId: null // null since it's an offline sale without user account
                }
            });
            return updatedProduct;
        }));
        // Execute all updates
        const updatedProducts = yield Promise.all(updatePromises);
        return res.status(200).json({
            message: 'Inventory updated successfully and orders created',
            updatedProducts: updatedProducts.map(product => ({
                id: product.id,
                name: product.name,
                newQuantity: product.quantity
            }))
        });
    }
    catch (error) {
        console.error('Error updating inventory:', error);
        return res.status(500).json({
            error: 'Failed to update inventory',
            // @ts-ignore
            details: error.message
        });
    }
}));
// GET /shop/:shopId - Get shop details
exports.shopRouter.get('/:shopId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        if (isNaN(shopId)) {
            return res.status(400).json({ error: 'Invalid shop ID' });
        }
        const shop = yield index_1.prisma.shop.findUnique({
            where: {
                id: shopId
            },
            select: {
                id: true,
                name: true,
                isActive: true,
                rating: true,
                opens: true,
                closes: true,
                tagline: true,
                image: true,
                pin: true,
                localArea: true,
                coinValue: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        return res.status(200).json(shop);
    }
    catch (error) {
        console.error('Error fetching shop details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /shop/:shopId/products - Add new product to shop
exports.shopRouter.post('/:shopId/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        const { name, image, price, quantity, canBePurchasedByCoin, ownerId } = req.body;
        if (isNaN(shopId)) {
            return res.status(400).json({ error: 'Invalid shop ID' });
        }
        if (!name || !price || !quantity) {
            return res.status(400).json({ error: 'Name, price, and quantity are required' });
        }
        if (!ownerId) {
            return res.status(400).json({ error: 'Owner ID is required' });
        }
        // Verify shop ownership
        const shop = yield index_1.prisma.shop.findFirst({
            where: {
                id: shopId,
                ownerId: parseInt(ownerId)
            }
        });
        if (!shop) {
            return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
        }
        const newProduct = yield index_1.prisma.product.create({
            data: {
                name: name,
                image: image,
                shopId: shopId,
                price: parseInt(price),
                quantity: parseInt(quantity),
                canBePurchasedByCoin: canBePurchasedByCoin || false
            }
        });
        return res.status(201).json(newProduct);
    }
    catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// PUT /shop/:shopId/products/:productId - Update product
exports.shopRouter.put('/:shopId/products/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        const productId = parseInt(req.params.productId);
        const { name, image, price, quantity, canBePurchasedByCoin, ownerId } = req.body;
        if (isNaN(shopId) || isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid shop ID or product ID' });
        }
        if (!ownerId) {
            return res.status(400).json({ error: 'Owner ID is required' });
        }
        // Verify shop ownership
        const shop = yield index_1.prisma.shop.findFirst({
            where: {
                id: shopId,
                ownerId: parseInt(ownerId)
            }
        });
        if (!shop) {
            return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
        }
        // Verify product belongs to shop
        const existingProduct = yield index_1.prisma.product.findFirst({
            where: {
                id: productId,
                shopId: shopId
            }
        });
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found in this shop' });
        }
        const updatedProduct = yield index_1.prisma.product.update({
            where: {
                id: productId
            },
            data: {
                name: name || existingProduct.name,
                image: image !== undefined ? image : existingProduct.image,
                price: price !== undefined ? parseInt(price) : existingProduct.price,
                quantity: quantity !== undefined ? parseInt(quantity) : existingProduct.quantity,
                canBePurchasedByCoin: canBePurchasedByCoin !== undefined ? canBePurchasedByCoin : existingProduct.canBePurchasedByCoin
            }
        });
        return res.status(200).json(updatedProduct);
    }
    catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// DELETE /shop/:shopId/products/:productId - Delete product
exports.shopRouter.delete('/:shopId/products/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        const productId = parseInt(req.params.productId);
        const { ownerId } = req.body;
        if (isNaN(shopId) || isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid shop ID or product ID' });
        }
        if (!ownerId) {
            return res.status(400).json({ error: 'Owner ID is required' });
        }
        // Verify shop ownership
        const shop = yield index_1.prisma.shop.findFirst({
            where: {
                id: shopId,
                ownerId: parseInt(ownerId)
            }
        });
        if (!shop) {
            return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
        }
        // Verify product belongs to shop
        const existingProduct = yield index_1.prisma.product.findFirst({
            where: {
                id: productId,
                shopId: shopId
            }
        });
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found in this shop' });
        }
        yield index_1.prisma.product.delete({
            where: {
                id: productId
            }
        });
        return res.status(200).json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /shop/:shopId/orders - Get all orders for a shop
exports.shopRouter.get('/:shopId/orders', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopId = parseInt(req.params.shopId);
        if (isNaN(shopId)) {
            return res.status(400).json({ error: 'Invalid shop ID' });
        }
        const orders = yield index_1.prisma.order.findMany({
            where: {
                shopId: shopId
            },
            include: {
                consumer: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        phone: true
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json(orders);
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.shopRouter.post("/feedback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ownerId, feedbackType, title, description, timestamp } = req.body;
    if (!feedbackType || !title || !description || !timestamp) {
        return res.json({ message: 'informatin missing' });
    }
    try {
        const response = yield index_1.prisma.feedback.create({
            data: {
                ownerId,
                feedbackType,
                title,
                description,
                time: timestamp
            }
        });
        res.status(200).json({ message: "got it " });
    }
    catch (e) {
        return res.json({ error: e });
    }
}));
exports.shopRouter.post("/shopname", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.body;
    try {
        const shopName = yield index_1.prisma.shop.findFirst({
            where: {
                id: parseInt(shopId)
            },
            select: {
                name: true,
                tagline: true,
            }
        });
        return res.status(201).json({ message: shopName === null || shopName === void 0 ? void 0 : shopName.name, tagline: shopName === null || shopName === void 0 ? void 0 : shopName.tagline });
    }
    catch (e) {
        console.error(e.message);
        return res.status(502).json({ message: "error occured while getting the shopName" });
    }
    ;
}));
exports.shopRouter.post("/own/already", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { storedownerIds } = req.body;
    let ankush = 0;
    console.log("hitted");
    try {
        const ispresent = yield index_1.prisma.shopKeeper.findFirst({
            where: {
                id: storedownerIds
            }
        });
        if (ispresent) {
            ankush = 1;
        }
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: "error while checking db " });
    }
    return res.status(200).json({ message: ankush, islive: "yes" });
}));
