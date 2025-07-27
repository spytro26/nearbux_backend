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
                localArea: area,
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
    const token = jsonwebtoken_1.default.sign({ id: foundUser.id }, jwt_pass);
    console.log(foundUser.id);
    res.json({ token, id: foundUser.id });
}));
exports.userRouter.post("/updatepass", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, newPassword } = req.body;
    const already = yield index_1.prisma.user.findFirst({
        where: {
            phone: phoneNumber
        }
    });
    if (already) {
        try {
            const hash = yield bcrypt_1.default.hash(newPassword, 3);
            yield index_1.prisma.user.update({
                where: {
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
// userRouter.post("/shops-availabe", async (req ,res) : Promise <any> =>{
//   const {area ,  pincode} = req.body;
//    let shops= null;
//    try {
//     shops = await prisma.shop.findMany({where : {
//       localArea : area,
//       pin : pincode
//     }})
//    }catch(e){
//     console.error(e);
//    }
//    return res.status(200).json({shops });
// })
//  hata de bhai
exports.userRouter.post("/shops-available", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { area, pincode } = req.body;
    try {
        const shops = yield index_1.prisma.shop.findMany({
            where: {
                OR: [
                    { localArea: area },
                    { pin: pincode },
                ],
                isActive: true
            },
            include: {
                owner: {
                    select: {
                        name: true,
                        verified: true
                    }
                },
                products: {
                    select: {
                        id: true,
                        name: true,
                        price: true
                    }
                },
                _count: {
                    select: {
                        products: true
                    }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            shops: shops,
            count: shops.length
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while fetching shops"
        });
    }
}));
//2. Get advertisements
exports.userRouter.get("/advertisements", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const advertisements = yield index_1.prisma.adver.findMany({
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true,
                        rating: true,
                        localArea: true,
                        pin: true,
                        isActive: true
                    }
                }
            },
            where: {
                shop: {
                    isActive: true
                }
            },
            orderBy: {
                views: 'desc'
            },
            take: 10 // Limit to top 10 advertisements
        });
        return res.status(200).json({
            success: true,
            advertisements: advertisements
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while fetching advertisements"
        });
    }
}));
// userRouter.post("/orders", async (req, res) : Promise <any> => {
//   const { userId } = req.body; // Get userId from request body instead of middleware
//   if (!userId) {
//     return res.status(401).json({
//       success: false,
//       message: "User ID is required"
//     });
//   }
//   try {
//     const orders = await prisma.order.findMany({
//       where: {
//         soldToId: parseInt(userId)
//       },
//       include: {
//         product: {
//           select: {
//             id: true,
//             name: true,
//             price: true,
//             image: true
//           }
//         },
//         seller: {
//           select: {
//             id: true,
//             name: true,
//             localArea: true,
//             pin: true
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });
//     return res.status(200).json({
//       success: true,
//       orders: orders,
//       count: orders.length
//     });
//   } catch (e) {
//     console.log(e);
//     return res.status(400).json({
//       success: false,
//       message: "Error while fetching orders"
//     });
//   }
// });
// userRouter.post("/orders/:orderId", async (req, res) : Promise <any> => {
//   const { orderId } = req.params;
//   const { userId } = req.body; // Get userId from request body instead of middleware
//   if (!userId) {
//     return res.status(401).json({
//       success: false,
//       message: "User ID is required"
//     });
//   }
//   try {
//     const order = await prisma.order.findFirst({
//       where: {
//         AND: [
//           { id: parseInt(orderId) },
//           { soldToId: parseInt(userId) }
//         ]
//       },
//       include: {
//         product: {
//           select: {
//             id: true,
//             name: true,
//             price: true,
//             image: true
//           }
//         },
//         seller: {
//           select: {
//             id: true,
//             name: true,
//             localArea: true,
//             pin: true
//           },
//           include: {
//             owner: {
//               select: {
//                 phone: true
//               }
//             }
//           }
//         }
//       }
//     });
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }
//     const totalAmount = order.product.price * order.quantity;
//     return res.status(200).json({
//       success: true,
//       order: {
//         ...order,
//         totalAmount: totalAmount,
//         sellerPhone: order.seller.owner.phone // Add phone separately
//       }
//     });
//   } catch (e) {
//     console.log(e);
//     return res.status(400).json({
//       success: false,
//       message: "Error while fetching order details"
//     });
//   }
// });
// 5. Get shop products (for when user clicks on a shop)
exports.userRouter.get("/shop/:shopId/products", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.params;
    console.log("hitted hu bahi ");
    try {
        const shop = yield index_1.prisma.shop.findFirst({
            where: {
                AND: [
                    { id: parseInt(shopId) },
                    { isActive: true }
                ]
            },
            include: {
                owner: {
                    select: {
                        name: true,
                        verified: true
                    }
                }
            }
        });
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found"
            });
        }
        const products = yield index_1.prisma.product.findMany({
            where: {
                shopId: parseInt(shopId)
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            shop: shop,
            products: products,
            productCount: products.length
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while fetching shop products"
        });
    }
}));
// 6. Update advertisement views/clicks (for analytics)
exports.userRouter.post("/advertisement/:adId/view", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { adId } = req.params;
    try {
        yield index_1.prisma.adver.update({
            where: {
                id: parseInt(adId)
            },
            data: {
                views: {
                    increment: 1
                }
            }
        });
        return res.status(200).json({
            success: true,
            message: "View recorded"
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while recording view"
        });
    }
}));
exports.userRouter.post("/advertisement/:adId/click", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { adId } = req.params;
    try {
        yield index_1.prisma.adver.update({
            where: {
                id: parseInt(adId)
            },
            data: {
                clicks: {
                    increment: 1
                }
            }
        });
        return res.status(200).json({
            success: true,
            message: "Click recorded"
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while recording click"
        });
    }
}));
exports.userRouter.post("/advertisement/:adId/click", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { adId } = req.params;
    try {
        yield index_1.prisma.adver.update({
            where: {
                id: parseInt(adId)
            },
            data: {
                clicks: {
                    increment: 1
                }
            }
        });
        return res.status(200).json({
            success: true,
            message: "Click recorded"
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while recording click"
        });
    }
}));
// hata do 
// Add this route to your userRouter
exports.userRouter.post("/cart/add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, productId } = req.body;
    console.log("Adding to cart:", { userId, productId });
    try {
        // Validate input
        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Product ID are required"
            });
        }
        // Check if user exists
        const user = yield index_1.prisma.user.findFirst({
            where: { id: parseInt(userId) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Check if product exists and is available
        const product = yield index_1.prisma.product.findFirst({
            where: {
                id: parseInt(productId),
                quantity: { gt: 0 } // Check if product has stock
            },
            include: {
                shop: {
                    select: {
                        isActive: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or out of stock"
            });
        }
        if (!product.shop.isActive) {
            return res.status(400).json({
                success: false,
                message: "Shop is currently inactive"
            });
        }
        // Check if item already exists in cart
        const existingCartItem = yield index_1.prisma.cart.findFirst({
            where: {
                AND: [
                    { userId: parseInt(userId) },
                    { productId: parseInt(productId) }
                ]
            }
        });
        if (existingCartItem) {
            return res.status(400).json({
                success: false,
                message: "Item already exists in cart"
            });
        }
        // Add item to cart
        const cartItem = yield index_1.prisma.cart.create({
            data: {
                userId: parseInt(userId),
                productId: parseInt(productId)
            },
            include: {
                product: {
                    select: {
                        name: true,
                        price: true,
                        image: true
                    }
                }
            }
        });
        return res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            cartItem: cartItem
        });
    }
    catch (e) {
        console.log("Error adding to cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while adding item to cart"
        });
    }
}));
// Optional: Get cart items for a user
exports.userRouter.post("/cart/items", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        const cartItems = yield index_1.prisma.cart.findMany({
            where: { userId: parseInt(userId) },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        quantity: true,
                        shop: {
                            select: {
                                id: true,
                                name: true,
                                coinValue: true,
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            cartItems: cartItems,
            itemCount: cartItems.length
        });
    }
    catch (e) {
        console.log("Error fetching cart items:", e);
        return res.status(500).json({
            success: false,
            message: "Error while fetching cart items"
        });
    }
}));
// Optional: Remove item from cart
exports.userRouter.delete("/cart/remove/:cartItemId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cartItemId } = req.params;
    try {
        const cartItem = yield index_1.prisma.cart.findFirst({
            where: { id: parseInt(cartItemId) }
        });
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }
        yield index_1.prisma.cart.deleteMany({
            where: { id: parseInt(cartItemId) }
        });
        return res.status(200).json({
            success: true,
            message: "Item removed from cart successfully"
        });
    }
    catch (e) {
        console.log("Error removing from cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while removing item from cart"
        });
    }
}));
//lol
// Update cart item quantity
exports.userRouter.put("/cart/update", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cartItemId, quantity } = req.body;
    try {
        const updatedItem = yield index_1.prisma.cart.update({
            where: { id: parseInt(cartItemId) },
            data: { quantity: parseInt(quantity) }
        });
        return res.status(200).json({ success: true, item: updatedItem });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: "Error updating cart" });
    }
}));
exports.userRouter.get("/offers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offers = yield index_1.prisma.offer.findMany({
            include: {
                shops: {
                    select: {
                        id: true,
                        name: true,
                        coinValue: true
                    }
                },
                products: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return res.status(200).json({ success: true, offers });
    }
    catch (e) {
        console.log("Error fetching offers:", e);
        return res.status(500).json({
            success: false,
            message: "Error fetching offers"
        });
    }
}));
// Get user coins
exports.userRouter.post("/coins", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("coins checked");
    const { userId } = req.body;
    try {
        const user = yield index_1.prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: { coinsAvailable: true }
        });
        return res.status(200).json({ success: true, coins: (user === null || user === void 0 ? void 0 : user.coinsAvailable) || 0 });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: "Error fetching coins" });
    }
}));
// // Updated place order route with proper coin deduction
// userRouter.post("/place-order", async (req, res)  : Promise <any>=> {
//   const { userId, orders } = req.body;
//   try {
//     await prisma.$transaction(async (prisma) => {
//       const createdOrders = [];
//       for (const orderData of orders) {
//         // Validate and handle coin usage for payment (not offers)
//         if (orderData.coinsUsed > 0) {
//           // Get available coins for this shop
//           const coinsReceived = await prisma.coin.aggregate({
//             where: {
//               transTo: parseInt(userId),
//               transFrom: orderData.shopId
//             },
//             _sum: {
//                 //@ts-ignore
//               volume: true
//             }
//           });
//           const coinsUsedPreviously = await prisma.order.aggregate({
//             where: {
//               soldToId: parseInt(userId),
//               shopId: orderData.shopId,
//               coinsUsed: { gt: 0 }
//             },
//             _sum: {
//               coinsUsed: true
//             }
//           });
//   //@ts-ignore
//           const totalReceived = parseInt(coinsReceived._sum.volume) || 0;
//             //@ts-ignore
//           const totalUsed = parseInt(coinsUsedPreviously._sum.coinsUsed) || 0;
//           const availableCoins = totalReceived - totalUsed;
//           if (orderData.coinsUsed > availableCoins) {
//             throw new Error(`Insufficient coins for shop ${orderData.shopId}. Available: ${availableCoins}, Requested: ${orderData.coinsUsed}`);
//           }
//         }
//         // Create orders for each item
//         for (const item of orderData.items) {
//           const order = await prisma.order.create({
//             data: {
//               soldToId: parseInt(userId),
//               productId: item.productId,
//               quantity: item.quantity,
//               shopId: orderData.shopId,
//               offerId: orderData.offerId,
//               coinsUsed: orderData.coinsUsed || 0
//             }
//           });
//           createdOrders.push(order);
//           // Remove from cart
//           await prisma.cart.deleteMany({
//             where: { id: item.cartItemId }
//           });
//         }
//       }
//       return createdOrders;
//     });
//     return res.status(200).json({ 
//       success: true, 
//       message: "Orders placed successfully" 
//     });
//   } catch (e) {
//     console.log("Error placing order:", e);
//     return res.status(500).json({ 
//       success: false, 
//         //@ts-ignore
//       message: e.message || "Error placing order" 
//     });
//   }
// });
// Updated shop-coins route to get available coins per shop
// 3. SHOP COINS ROUTE - userRouter.post("/shop-coins")
//1008 
// userRouter.post("/shop-coins", async (req, res) : Promise <any> => {
//   const { userId } = req.body;
//   try {
//     // Get all coins received by user
//     const coinsReceived = await prisma.shopToUserCoin.findMany({
//       where: { userId: parseInt(userId) },
//       select: {
//         shopId: true,
//         volume: true,
//         shop: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });
//     // Get all coins used by user to shops
//     const coinsUsedDirectly = await prisma.userToShopCoin.findMany({
//       where: { userId: parseInt(userId) },
//       select: {
//         shopId: true,
//         volume: true
//       }
//     });
//     // Get all coins used in orders through OrderGroup
//     const coinsUsedInOrders = await prisma.orderGroup.findMany({
//       where: {
//         userId: parseInt(userId),
//         coinsUsed: { gt: 0 }
//       },
//       select: {
//         shopId: true,
//         coinsUsed: true
//       }
//     });
//     // Calculate available coins per shop
//     const shopCoins = {};
//     // Sum received coins by shop
//     coinsReceived.forEach(coin => {
//       const shopId = coin.shopId;
//       //@ts-ignore
//       if (!shopCoins[shopId]) {
//         //@ts-ignore
//         shopCoins[shopId] = 0;
//       }
//       //@ts-ignore
//       shopCoins[shopId] += parseInt(coin.volume);
//     });
//     // Subtract coins used directly to shops
//     coinsUsedDirectly.forEach(coin => {
//       const shopId = coin.shopId;
//       //@ts-ignore
//       if (shopCoins[shopId]) {
//         //@ts-ignore
//         shopCoins[shopId] -= coin.volume;
//       }
//     });
//     // Subtract used coins by shop
//     coinsUsedInOrders.forEach(orderGroup => {
//       const shopId = orderGroup.shopId;
//       //@ts-ignore
//       if (shopCoins[shopId]) {
//         //@ts-ignore
//         shopCoins[shopId] -= orderGroup.coinsUsed;
//       }
//     });
//     // Ensure no negative values
//     Object.keys(shopCoins).forEach(shopId => {
//       //@ts-ignore
//       if (shopCoins[shopId] < 0) {
//         //@ts-ignore
//         shopCoins[shopId] = 0;
//       }
//     });
//     return res.status(200).json({
//       success: true,
//       shopCoins: shopCoins
//     });
//   } catch (e) {
//     console.log("Error fetching shop coins:", e);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching shop coins"
//     });
//   }
// });
// Route to get shop details including coin value
exports.userRouter.get("/shop/:shopId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shopId } = req.params;
    console.log("checking value of coin");
    try {
        const shop = yield index_1.prisma.shop.findUnique({
            where: { id: parseInt(shopId) },
            select: {
                id: true,
                name: true,
                coinValue: true,
                isActive: true
            }
        });
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found"
            });
        }
        return res.status(200).json({
            success: true,
            shop: shop
        });
    }
    catch (e) {
        console.log("Error fetching shop details:", e);
        return res.status(500).json({
            success: false,
            message: "Error fetching shop details"
        });
    }
}));
// Get user's cart with shop information
exports.userRouter.get("/cart/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        const cartItems = yield index_1.prisma.cart.findMany({
            where: { userId: parseInt(userId) },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        quantity: true,
                        shopId: true,
                        shop: {
                            select: {
                                id: true,
                                name: true,
                                coinValue: true,
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            cart: cartItems,
            itemCount: cartItems.length
        });
    }
    catch (e) {
        console.log("Error fetching cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while fetching cart"
        });
    }
}));
// Clear entire cart for a user
exports.userRouter.delete("/cart/clear/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        // Check if user exists
        const user = yield index_1.prisma.user.findFirst({
            where: { id: parseInt(userId) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Delete all cart items for the user
        const deletedItems = yield index_1.prisma.cart.deleteMany({
            where: { userId: parseInt(userId) }
        });
        return res.status(200).json({
            success: true,
            message: `Successfully cleared ${deletedItems.count} items from cart`
        });
    }
    catch (e) {
        console.log("Error clearing cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while clearing cart"
        });
    }
}));
// Clear cart items from a specific shop for a user
exports.userRouter.delete("/cart/clear-shop/:userId/:shopId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, shopId } = req.params;
    try {
        if (!userId || !shopId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Shop ID are required"
            });
        }
        // Delete cart items from specific shop
        const deletedItems = yield index_1.prisma.cart.deleteMany({
            where: {
                userId: parseInt(userId),
                product: {
                    shopId: parseInt(shopId)
                }
            }
        });
        return res.status(200).json({
            success: true,
            message: `Successfully cleared ${deletedItems.count} items from shop ${shopId}`
        });
    }
    catch (e) {
        console.log("Error clearing shop cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while clearing shop cart items"
        });
    }
}));
// Enhanced add to cart with shop conflict checking
exports.userRouter.post("/cart/add-with-conflict-check", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, productId, quantity = 1, clearExistingCart = false } = req.body;
    try {
        // Validate input
        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Product ID are required"
            });
        }
        // Get product with shop information
        const product = yield index_1.prisma.product.findFirst({
            where: {
                id: parseInt(productId),
                quantity: { gte: parseInt(quantity) }
            },
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or insufficient stock"
            });
        }
        if (!product.shop.isActive) {
            return res.status(400).json({
                success: false,
                message: "Shop is currently inactive"
            });
        }
        // Check existing cart items
        const existingCartItems = yield index_1.prisma.cart.findMany({
            where: { userId: parseInt(userId) },
            include: {
                product: {
                    select: {
                        shopId: true,
                        shop: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // Check for shop conflicts
        if (existingCartItems.length > 0) {
            const existingShopId = existingCartItems[0].product.shopId;
            const newShopId = product.shop.id;
            if (existingShopId !== newShopId) {
                if (!clearExistingCart) {
                    return res.status(409).json({
                        success: false,
                        message: "Cart contains items from a different shop",
                        conflict: true,
                        existingShop: existingCartItems[0].product.shop.name,
                        newShop: product.shop.name,
                        existingShopId: existingShopId,
                        newShopId: newShopId
                    });
                }
                else {
                    // Clear existing cart as requested
                    yield index_1.prisma.cart.deleteMany({
                        where: { userId: parseInt(userId) }
                    });
                }
            }
        }
        // Check if item already exists in cart (after potential clearing)
        const existingCartItem = yield index_1.prisma.cart.findFirst({
            where: {
                AND: [
                    { userId: parseInt(userId) },
                    { productId: parseInt(productId) }
                ]
            }
        });
        let cartItem;
        if (existingCartItem) {
            // Update existing item quantity
            cartItem = yield index_1.prisma.cart.update({
                where: { id: existingCartItem.id },
                data: { quantity: existingCartItem.quantity + parseInt(quantity) },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            image: true,
                            shopId: true
                        }
                    }
                }
            });
        }
        else {
            // Create new cart item
            cartItem = yield index_1.prisma.cart.create({
                data: {
                    userId: parseInt(userId),
                    productId: parseInt(productId),
                    quantity: parseInt(quantity)
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            image: true,
                            shopId: true
                        }
                    }
                }
            });
        }
        return res.status(200).json({
            success: true,
            message: existingCartItem ? "Cart item quantity updated" : "Item added to cart successfully",
            cartItem: cartItem
        });
    }
    catch (e) {
        console.log("Error adding to cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while adding item to cart"
        });
    }
}));
// Bulk add to cart (for local cart synchronization)
exports.userRouter.post("/cart/bulk-add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, items, clearExistingCart = false } = req.body;
    try {
        if (!userId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "User ID and items array are required"
            });
        }
        // Clear existing cart if requested
        if (clearExistingCart) {
            yield index_1.prisma.cart.deleteMany({
                where: { userId: parseInt(userId) }
            });
        }
        const results = [];
        for (const item of items) {
            try {
                // Check if product exists and has sufficient stock
                const product = yield index_1.prisma.product.findFirst({
                    where: {
                        id: parseInt(item.productId),
                        quantity: { gte: parseInt(item.quantity) }
                    }
                });
                if (!product) {
                    results.push({
                        productId: item.productId,
                        success: false,
                        message: "Product not found or insufficient stock"
                    });
                    continue;
                }
                // Check if item already exists in cart
                const existingCartItem = yield index_1.prisma.cart.findFirst({
                    where: {
                        AND: [
                            { userId: parseInt(userId) },
                            { productId: parseInt(item.productId) }
                        ]
                    }
                });
                let cartItem;
                if (existingCartItem) {
                    // Update existing item
                    cartItem = yield index_1.prisma.cart.update({
                        where: { id: existingCartItem.id },
                        data: { quantity: parseInt(item.quantity) }
                    });
                }
                else {
                    // Create new item
                    cartItem = yield index_1.prisma.cart.create({
                        data: {
                            userId: parseInt(userId),
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity)
                        }
                    });
                }
                results.push({
                    productId: item.productId,
                    success: true,
                    cartItem: cartItem
                });
            }
            catch (itemError) {
                results.push({
                    productId: item.productId,
                    success: false,
                    message: "Error processing item"
                });
            }
        }
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        return res.status(200).json({
            success: true,
            message: `Successfully processed ${successCount} items, ${failCount} failed`,
            results: results,
            successCount: successCount,
            failCount: failCount
        });
    }
    catch (e) {
        console.log("Error bulk adding to cart:", e);
        return res.status(500).json({
            success: false,
            message: "Error while bulk adding items to cart"
        });
    }
}));
exports.userRouter.post("/place-order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, orders } = req.body;
    try {
        yield index_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const createdOrderGroups = [];
            for (const orderData of orders) {
                // Check if shop is active
                const shop = yield tx.shop.findUnique({
                    where: { id: orderData.shopId },
                    select: { isActive: true, name: true, coinValue: true }
                });
                if (!shop) {
                    throw new Error(`Shop with ID ${orderData.shopId} not found`);
                }
                if (!shop.isActive) {
                    throw new Error(`Cannot place order. ${shop.name} is currently inactive. Please wait until the shop is active to place your order.`);
                }
                // Calculate total amount for this order group first
                let totalAmount = 0;
                for (const item of orderData.items) {
                    const product = yield tx.product.findUnique({
                        where: { id: item.productId },
                        select: { price: true }
                    });
                    if (product) {
                        totalAmount += product.price * item.quantity;
                    }
                }
                // Validate minimum order amount for coin usage (300 minimum)
                if (orderData.coinsUsed > 0 && totalAmount < 300) {
                    throw new Error(`Minimum order of ₹300 required to use coins. Current order: ₹${totalAmount}`);
                }
                // Function to get available coins - ONLY use UserToShopCoin table
                const getAvailableCoins = (userId, shopId) => __awaiter(void 0, void 0, void 0, function* () {
                    // Get coins received from shop
                    const coinsReceived = yield tx.shopToUserCoin.aggregate({
                        where: {
                            userId: userId,
                            shopId: shopId
                        },
                        _sum: {
                            volume: true
                        }
                    });
                    // Get coins used (ONLY from UserToShopCoin table)
                    const coinsUsed = yield tx.userToShopCoin.aggregate({
                        where: {
                            userId: userId,
                            shopId: shopId
                        },
                        _sum: {
                            volume: true
                        }
                    });
                    const totalReceived = parseInt(coinsReceived._sum.volume) || 0;
                    const totalUsed = parseInt(coinsUsed._sum.volume) || 0;
                    return totalReceived - totalUsed;
                });
                // Validate and handle coin usage for payment (not offers)
                if (orderData.coinsUsed > 0) {
                    const availableCoins = yield getAvailableCoins(parseInt(userId), orderData.shopId);
                    if (orderData.coinsUsed > availableCoins) {
                        throw new Error(`Insufficient coins for shop ${orderData.shopId}. Available: ${availableCoins}, Requested: ${orderData.coinsUsed}`);
                    }
                }
                // Validate product offers if selected
                let offerCoinUsage = 0;
                if (orderData.offerId) {
                    const offer = yield tx.offer.findUnique({
                        where: { id: orderData.offerId },
                        select: {
                            type: true,
                            coinValue: true,
                            minimum_amount: true,
                            shop: true
                        }
                    });
                    if (offer) {
                        // Check if offer belongs to the correct shop
                        if (offer.shop !== orderData.shopId) {
                            throw new Error(`Offer does not belong to this shop`);
                        }
                        // Check minimum amount requirement
                        if (offer.minimum_amount && totalAmount < offer.minimum_amount) {
                            throw new Error(`Minimum order of ₹${offer.minimum_amount} required for this offer. Current order: ₹${totalAmount}`);
                        }
                        // For product offers, validate coin availability
                        if (offer.type === 'product' && offer.coinValue) {
                            const availableCoins = yield getAvailableCoins(parseInt(userId), orderData.shopId);
                            const coinsNeededForOffer = offer.coinValue;
                            const totalCoinsNeeded = (orderData.coinsUsed || 0) + coinsNeededForOffer;
                            if (totalCoinsNeeded > availableCoins) {
                                throw new Error(`Insufficient coins for this product offer. Required: ${totalCoinsNeeded} (${orderData.coinsUsed || 0} for payment + ${coinsNeededForOffer} for offer), Available: ${availableCoins}`);
                            }
                            offerCoinUsage = coinsNeededForOffer;
                        }
                    }
                }
                // Validate stock availability for all items first
                for (const item of orderData.items) {
                    const product = yield tx.product.findUnique({
                        where: { id: item.productId },
                        select: { price: true, quantity: true, name: true }
                    });
                    if (!product) {
                        throw new Error(`Product with ID ${item.productId} not found`);
                    }
                    // Check stock availability (validation remains)
                    if (product.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
                    }
                }
                // Create OrderGroup first
                const orderGroup = yield tx.orderGroup.create({
                    data: {
                        userId: parseInt(userId),
                        shopId: orderData.shopId,
                        totalAmount: totalAmount,
                        coinsUsed: orderData.coinsUsed || 0, // Keep this for reference/reporting only
                        status: 'PENDING'
                    }
                });
                // Create entry in UserToShopCoin table for coins used in payment
                if (orderData.coinsUsed > 0) {
                    yield tx.userToShopCoin.create({
                        data: {
                            userId: parseInt(userId),
                            shopId: orderData.shopId,
                            volume: orderData.coinsUsed
                        }
                    });
                }
                // Create entry in UserToShopCoin table for coins used in product offers
                if (offerCoinUsage > 0) {
                    yield tx.userToShopCoin.create({
                        data: {
                            userId: parseInt(userId),
                            shopId: orderData.shopId,
                            volume: offerCoinUsage
                        }
                    });
                }
                // Create individual orders for each item
                for (const item of orderData.items) {
                    const product = yield tx.product.findUnique({
                        where: { id: item.productId },
                        select: { price: true }
                    });
                    // Create the order
                    yield tx.order.create({
                        data: {
                            orderGroupId: orderGroup.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: (product === null || product === void 0 ? void 0 : product.price) || 0,
                            offerId: orderData.offerId
                        }
                    });
                    // Remove from cart
                    yield tx.cart.deleteMany({
                        where: { id: item.cartItemId }
                    });
                }
                createdOrderGroups.push(orderGroup);
            }
            return createdOrderGroups;
        }), {
            maxWait: 10000, // 10 seconds max wait
            timeout: 20000, // 20 seconds timeout
        });
        return res.status(200).json({
            success: true,
            message: "Orders placed successfully"
        });
    }
    catch (e) {
        console.log("Error placing order:", e);
        return res.status(500).json({
            success: false,
            message: e.message || "Error placing order"
        });
    }
}));
// Get all order groups for a user
exports.userRouter.post("/orders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body; // Get userId from request body instead of middleware
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User ID is required"
        });
    }
    try {
        const orderGroups = yield index_1.prisma.orderGroup.findMany({
            where: {
                userId: parseInt(userId)
            },
            include: {
                orders: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                image: true
                            }
                        },
                        offer: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                description: true,
                                percentage: true,
                                fixed: true,
                                coinValue: true,
                                product: true,
                                products: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        image: true
                                    }
                                }
                            }
                        }
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        localArea: true,
                        pin: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Transform the data to match the expected format
        const transformedOrders = yield Promise.all(orderGroups.map((orderGroup) => __awaiter(void 0, void 0, void 0, function* () {
            const items = orderGroup.orders.map(order => {
                let finalPrice = order.unitPrice * order.quantity;
                let discountAmount = 0;
                let freeProduct = null;
                // Calculate offer effects if offer exists
                if (order.offer) {
                    const offer = order.offer;
                    const itemTotal = order.unitPrice * order.quantity;
                    if (offer.type === 'percentage' && offer.percentage) {
                        discountAmount = Math.floor((itemTotal * offer.percentage) / 100);
                        finalPrice = itemTotal - discountAmount;
                    }
                    else if (offer.type === 'money' && offer.fixed) {
                        discountAmount = Math.min(offer.fixed, itemTotal);
                        finalPrice = itemTotal - discountAmount;
                    }
                    else if (offer.type === 'product' && offer.products) {
                        // For product offers, the free product is included
                        freeProduct = offer.products;
                    }
                }
                return {
                    id: order.id,
                    productId: order.productId,
                    quantity: order.quantity,
                    unitPrice: order.unitPrice,
                    finalPrice: finalPrice,
                    discountAmount: discountAmount,
                    product: order.product,
                    offer: order.offer,
                    freeProduct: freeProduct
                };
            });
            // Calculate total final price for the order group after offers
            const totalFinalPrice = items.reduce((sum, item) => sum + item.finalPrice, 0);
            const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
            // Calculate coin discount if coins were used
            let coinDiscount = 0;
            let coinValue = 0;
            let finalPriceAfterCoins = totalFinalPrice;
            if (orderGroup.coinsUsed > 0) {
                // Get the shop's coin value
                const shop = yield index_1.prisma.shop.findUnique({
                    where: { id: orderGroup.shopId },
                    select: { coinValue: true }
                });
                if (shop && shop.coinValue) {
                    // Calculate single coin value (coinValue / 100)
                    coinValue = shop.coinValue / 100;
                    // Calculate total coin discount
                    coinDiscount = orderGroup.coinsUsed * coinValue;
                    // Calculate final price after coin deduction
                    finalPriceAfterCoins = Math.max(0, totalFinalPrice - coinDiscount);
                }
            }
            return {
                id: orderGroup.id,
                totalAmount: orderGroup.totalAmount,
                totalFinalPrice: totalFinalPrice,
                totalDiscount: totalDiscount,
                coinsUsed: orderGroup.coinsUsed,
                coinValue: coinValue,
                coinDiscount: coinDiscount,
                finalPriceAfterCoins: finalPriceAfterCoins,
                status: orderGroup.status,
                createdAt: orderGroup.createdAt,
                updatedAt: orderGroup.updatedAt,
                soldOffline: orderGroup.soldOffline,
                seller: orderGroup.shop,
                items: items
            };
        })));
        return res.status(200).json({
            success: true,
            orders: transformedOrders,
            count: transformedOrders.length
        });
    }
    catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            message: "Error while fetching orders"
        });
    }
}));
// 2. CANCEL ORDER ROUTE - userRouter.post('/orders/:orderGroupId/cancel')
exports.userRouter.post('/orders/:orderGroupId/cancel', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { orderGroupId } = req.params;
        const { userId } = req.body;
        // Validate inputs
        if (!orderGroupId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and User ID are required'
            });
        }
        // Validate that orderGroupId and userId are valid numbers
        if (isNaN(parseInt(orderGroupId)) || isNaN(parseInt(userId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Order ID or User ID format'
            });
        }
        const orderGroupIdInt = parseInt(orderGroupId);
        const userIdInt = parseInt(userId);
        // First, validate the order outside of transaction to fail fast
        const orderGroup = yield index_1.prisma.orderGroup.findUnique({
            where: {
                id: orderGroupIdInt
            },
            include: {
                user: true,
                shop: true,
                orders: {
                    include: {
                        product: true,
                        offer: true
                    }
                }
            }
        });
        // Check if order exists
        if (!orderGroup) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        // Check if the order belongs to the requesting user
        if (orderGroup.userId !== userIdInt) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this order'
            });
        }
        // Check if order can be cancelled (only PENDING orders can be cancelled)
        if (orderGroup.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status: ${orderGroup.status}. Only PENDING orders can be cancelled.`
            });
        }
        // Calculate coins to refund
        const coinsToRefund = orderGroup.coinsUsed || 0;
        // Start a transaction with proper timeout and maxWait settings
        const result = yield index_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Update order status to CANCELLED
            const updatedOrderGroup = yield tx.orderGroup.update({
                where: {
                    id: orderGroupIdInt
                },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            });
            // Refund coins to user if any were used
            let updatedUser = null;
            if (coinsToRefund > 0) {
                // Update user's available coins
                updatedUser = yield tx.user.update({
                    where: {
                        id: userIdInt
                    },
                    data: {
                        coinsAvailable: {
                            increment: coinsToRefund
                        },
                        updatedAt: new Date()
                    }
                });
                // Create a coin transaction record for the refund
                yield tx.shopToUserCoin.create({
                    data: {
                        shopId: orderGroup.shopId,
                        userId: userIdInt,
                        volume: coinsToRefund
                    }
                });
            }
            // Restore product quantities back to inventory
            const productUpdates = orderGroup.orders.map(order => tx.product.update({
                where: {
                    id: order.productId
                },
                data: {
                    quantity: {
                        increment: order.quantity
                    },
                    updatedAt: new Date()
                }
            }));
            // Execute all product updates in parallel
            yield Promise.all(productUpdates);
            return {
                orderGroup: updatedOrderGroup,
                coinsRefunded: coinsToRefund,
                itemsRestored: orderGroup.orders.length,
                user: updatedUser
            };
        }), {
            maxWait: 5000, // 5 seconds max wait for a connection
            timeout: 10000, // 10 seconds transaction timeout
            isolationLevel: 'ReadCommitted' // Add isolation level for better consistency
        });
        // Log success outside of transaction
        if (result.coinsRefunded > 0) {
            console.log(`Refunded ${result.coinsRefunded} coins to user ${userIdInt} for cancelled order ${orderGroupIdInt}`);
        }
        // Success response
        return res.status(200).json({
            success: true,
            message: `Order cancelled successfully${result.coinsRefunded > 0 ? `. ${result.coinsRefunded} coins have been refunded to your account.` : '.'}`,
            data: {
                orderId: orderGroupIdInt,
                status: 'CANCELLED',
                coinsRefunded: result.coinsRefunded,
                itemsRestored: result.itemsRestored
            }
        });
    }
    catch (error) {
        console.error('Order cancellation error:', error);
        // Handle Prisma-specific errors
        //@ts-ignore
        if (error.code === 'P2028') {
            console.error('Transaction timeout or connection issue occurred');
            return res.status(500).json({
                success: false,
                message: 'Transaction failed due to timeout. Please try again.'
            });
        }
        //@ts-ignore
        if (error.code === 'P2034') {
            return res.status(409).json({
                success: false,
                message: 'Transaction conflict occurred. Please try again.'
            });
        }
        // Handle other specific error types
        //@ts-ignore
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Order not found')) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        //@ts-ignore
        if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this order'
            });
        }
        //@ts-ignore
        if ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('Cannot cancel order')) {
            return res.status(400).json({
                success: false,
                //@ts-ignore
                message: error.message
            });
        }
        // Generic server error
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
}));
// used by showing  orders 
// Updated backend route with product-type offer support
exports.userRouter.post("/orders/:orderGroupId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderGroupId } = req.params;
        const { userId } = req.body;
        console.log("Fetching order group details for orderGroupId:", orderGroupId, "userId:", userId);
        // Validate input
        if (!orderGroupId || !userId) {
            return res.status(400).json({
                message: "Order Group ID and User ID are required"
            });
        }
        // Find the order group with related data
        const orderGroup = yield index_1.prisma.orderGroup.findFirst({
            where: {
                id: parseInt(orderGroupId),
                userId: parseInt(userId) // Ensure the order group belongs to the requesting user
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        phone: true
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        tagline: true,
                        image: true,
                        localArea: true,
                        rating: true,
                        coinValue: true // Include coinValue from shop
                    }
                },
                orders: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                price: true,
                                canBePurchasedByCoin: true
                            }
                        },
                        offer: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                description: true,
                                percentage: true,
                                fixed: true,
                                coinValue: true,
                                product: true // Include product field for product-type offers
                            }
                        }
                    }
                }
            }
        });
        if (!orderGroup) {
            return res.status(404).json({
                message: "Order not found or you don't have permission to view this order"
            });
        }
        // Get all unique product IDs from product-type offers
        const productOfferIds = new Set();
        orderGroup.orders.forEach(order => {
            if (order.offer && order.offer.type === 'product' && order.offer.product) {
                productOfferIds.add(order.offer.product);
            }
        });
        // Fetch free product details for product-type offers
        //@ts-ignore
        let freeProducts = [];
        if (productOfferIds.size > 0) {
            freeProducts = yield index_1.prisma.product.findMany({
                where: {
                    id: {
                        //@ts-ignore
                        in: Array.from(productOfferIds)
                    }
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    price: true
                }
            });
        }
        // Create a map for quick lookup of free products
        //@ts-ignore
        const freeProductsMap = new Map();
        //@ts-ignore
        freeProducts.forEach(product => {
            freeProductsMap.set(product.id, product);
        });
        // Calculate total items and total discount from offers
        let totalItems = 0;
        let totalOfferDiscount = 0;
        //@ts-ignore
        let offersApplied = [];
        // Calculate original amount (before any discounts)
        let originalAmount = 0;
        // Track unique offers
        const uniqueOffers = new Map();
        orderGroup.orders.forEach(order => {
            totalItems += order.quantity;
            originalAmount += (order.unitPrice * order.quantity);
            // Calculate discount from offers
            if (order.offer) {
                // Only add unique offers
                if (!uniqueOffers.has(order.offer.id)) {
                    // Add free product details to offer if it's a product-type offer
                    const offerData = Object.assign({}, order.offer);
                    if (order.offer.type === 'product' && order.offer.product) {
                        const freeProduct = freeProductsMap.get(order.offer.product);
                        if (freeProduct) {
                            //@ts-ignore
                            offerData.freeProduct = freeProduct;
                        }
                    }
                    uniqueOffers.set(order.offer.id, offerData);
                }
                // Calculate discount for non-product offers
                if (order.offer.type === 'percentage' && order.offer.percentage) {
                    totalOfferDiscount += (order.unitPrice * order.quantity * order.offer.percentage) / 100;
                }
                else if (order.offer.type === 'money' && order.offer.fixed) {
                    totalOfferDiscount += order.offer.fixed;
                }
                // Note: product-type offers don't add to totalOfferDiscount as they're free items
            }
        });
        // Convert unique offers map to array
        offersApplied = Array.from(uniqueOffers.values());
        // Get coin value from shop (100 coins = shop.coinValue rupees)
        const coinValueInRupees = orderGroup.shop.coinValue || 100; // Default to 100 if not set
        const singleCoinValue = coinValueInRupees / 100; // Value of 1 coin
        // Calculate coins discount value
        const coinsUsed = orderGroup.coinsUsed || 0;
        const coinsDiscountValue = coinsUsed * singleCoinValue;
        // Final amount should be: original - offer discount - coins discount
        // But since totalAmount is already stored, we'll use it as the final amount
        const finalAmount = orderGroup.totalAmount;
        // Format the response
        const orderDetails = {
            id: orderGroup.id,
            status: orderGroup.status,
            totalAmount: finalAmount, // This is the final amount paid
            coinsUsed: coinsUsed,
            //@ts-ignore
            offersApplied: offersApplied,
            totalItems: totalItems,
            createdAt: orderGroup.createdAt,
            updatedAt: orderGroup.updatedAt,
            soldOffline: orderGroup.soldOffline,
            user: orderGroup.user,
            shop: orderGroup.shop,
            orders: orderGroup.orders,
            // Additional calculated fields
            originalAmount: originalAmount, // Amount before any discounts
            totalOfferDiscount: totalOfferDiscount, // Discount from offers
            coinsDiscountValue: coinsDiscountValue, // Rupee value of coins used
            singleCoinValue: singleCoinValue, // Value of 1 coin in rupees
            coinValueInRupees: coinValueInRupees, // Value of 100 coins in rupees
            //@ts-ignore
            freeProducts: freeProducts // Include free products for easy access
        };
        console.log("Order group details fetched successfully for orderGroup:", orderGroupId);
        console.log("Calculations:", {
            originalAmount,
            totalOfferDiscount,
            coinsUsed,
            coinsDiscountValue,
            singleCoinValue,
            finalAmount,
            freeProductsCount: freeProducts.length
        });
        res.json(orderDetails);
    }
    catch (error) {
        console.error("Error fetching order group details:", error);
        res.status(500).json({
            message: "Internal server error while fetching order details"
        });
    }
}));
exports.userRouter.post("/orders/:orderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const { userId } = req.body; // Get userId from request body instead of middleware
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User ID is required"
        });
    }
    try {
        const orderGroup = yield index_1.prisma.orderGroup.findFirst({
            where: {
                AND: [
                    { id: parseInt(orderId) },
                    { userId: parseInt(userId) }
                ]
            },
            include: {
                orders: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                image: true
                            }
                        },
                        offer: true
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        localArea: true,
                        pin: true,
                        coinValue: true, // This is crucial - the value for 100 coins
                        owner: {
                            select: {
                                phone: true
                            }
                        }
                    }
                }
            }
        });
        if (!orderGroup) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        // Calculate proper values
        const shopCoinValue = orderGroup.shop.coinValue; // Value for 100 coins
        const singleCoinValue = shopCoinValue / 100; // Value of 1 coin
        const coinsDiscountValue = (orderGroup.coinsUsed || 0) * singleCoinValue;
        // Calculate original amount and offer discounts
        let originalAmount = 0;
        let totalOfferDiscount = 0;
        const processedItems = yield Promise.all(orderGroup.orders.map((order) => __awaiter(void 0, void 0, void 0, function* () {
            const itemTotal = order.unitPrice * order.quantity;
            originalAmount += itemTotal;
            let itemOfferDiscount = 0;
            let processedOffer = null;
            if (order.offer) {
                const offer = order.offer;
                processedOffer = offer;
                // Calculate discount based on offer type
                switch (offer.type) {
                    case 'percentage':
                        itemOfferDiscount = (itemTotal * (offer.percentage || 0)) / 100;
                        break;
                    //@ts-ignore
                    case 'money':
                        //@ts-ignore
                        itemOfferDiscount = offer.fixed || 0;
                        break;
                    case 'product':
                        // For product type offers
                        if (offer.fixed) {
                            itemOfferDiscount = offer.fixed;
                        }
                        else if (offer.percentage) {
                            itemOfferDiscount = (itemTotal * offer.percentage) / 100;
                        }
                        break;
                    case 'money':
                        itemOfferDiscount = offer.fixed || 0;
                        break;
                    default:
                        itemOfferDiscount = 0;
                }
                totalOfferDiscount += itemOfferDiscount;
            }
            return {
                id: order.id,
                productId: order.productId,
                quantity: order.quantity,
                unitPrice: order.unitPrice,
                product: order.product,
                offer: processedOffer,
                offerDiscount: itemOfferDiscount
            };
        })));
        // Calculate the expected final amount
        const calculatedTotal = originalAmount - coinsDiscountValue - totalOfferDiscount;
        // Verify if our calculation matches the stored total
        const calculationMatches = Math.abs(calculatedTotal - orderGroup.totalAmount) < 1;
        // If calculations don't match, you might want to log this for debugging
        if (!calculationMatches) {
            console.log('Calculation mismatch:', {
                orderId: orderGroup.id,
                calculated: calculatedTotal,
                stored: orderGroup.totalAmount,
                original: originalAmount,
                coinsDiscount: coinsDiscountValue,
                offerDiscount: totalOfferDiscount
            });
        }
        // Transform the data to match expected format
        const transformedOrder = {
            id: orderGroup.id,
            totalAmount: orderGroup.totalAmount,
            coinsUsed: orderGroup.coinsUsed,
            status: orderGroup.status,
            createdAt: orderGroup.createdAt,
            updatedAt: orderGroup.updatedAt,
            soldOffline: orderGroup.soldOffline,
            seller: orderGroup.shop,
            sellerPhone: orderGroup.shop.owner.phone,
            items: processedItems,
            // Additional calculated fields for frontend
            calculations: {
                originalAmount,
                coinsDiscountValue,
                totalOfferDiscount,
                calculatedTotal,
                calculationMatches,
                singleCoinValue,
                shopCoinValue
            }
        };
        return res.status(200).json({
            success: true,
            order: transformedOrder
        });
    }
    catch (e) {
        console.log('Error fetching order details:', e);
        return res.status(400).json({
            success: false,
            message: "Error while fetching order details"
        });
    }
}));
function calculateOrderTotal(orders, coinsUsed, shopCoinValue) {
    return __awaiter(this, void 0, void 0, function* () {
        let originalAmount = 0;
        let totalOfferDiscount = 0;
        for (const order of orders) {
            const itemTotal = order.unitPrice * order.quantity;
            originalAmount += itemTotal;
            if (order.offer) {
                const offer = order.offer;
                let itemOfferDiscount = 0;
                switch (offer.type) {
                    case 'percentage':
                        itemOfferDiscount = (itemTotal * (offer.percentage || 0)) / 100;
                        break;
                    case 'fixed':
                        itemOfferDiscount = offer.fixed || 0;
                        break;
                    case 'product':
                        if (offer.fixed) {
                            itemOfferDiscount = offer.fixed;
                        }
                        else if (offer.percentage) {
                            itemOfferDiscount = (itemTotal * offer.percentage) / 100;
                        }
                        break;
                    case 'money':
                        itemOfferDiscount = offer.fixed || 0;
                        break;
                }
                totalOfferDiscount += itemOfferDiscount;
            }
        }
        const singleCoinValue = shopCoinValue / 100;
        const coinsDiscountValue = coinsUsed * singleCoinValue;
        const finalAmount = originalAmount - coinsDiscountValue - totalOfferDiscount;
        return {
            originalAmount,
            coinsDiscountValue,
            totalOfferDiscount,
            finalAmount: Math.max(0, finalAmount) // Ensure non-negative
        };
    });
}
exports.userRouter.post("/getaddress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    console.log("hiteed with" + userId);
    try {
        const ress = yield index_1.prisma.user.findFirst({
            where: {
                id: parseInt(userId)
            },
            select: {
                pin: true,
                localArea: true
            }
        });
        console.log(res);
        if (!ress) {
            return;
        }
        return res.status(200).json({ pincode: ress.pin, area: ress.localArea });
    }
    catch (e) {
        return res.status(500).json({ message: "error while getting address" });
    }
    //@ts-ignore
}));
exports.userRouter.post("/wallet-transactions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "UserId is required" });
        }
        // Validate userId is a number
        const userIdNumber = parseInt(userId);
        if (isNaN(userIdNumber)) {
            return res.status(400).json({ error: "Invalid userId format" });
        }
        // Get user's current coin balance
        const user = yield index_1.prisma.user.findUnique({
            where: { id: userIdNumber },
            select: { coinsAvailable: true }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Get incoming transactions (ShopToUser) - coins received
        const incomingTransactions = yield index_1.prisma.shopToUserCoin.findMany({
            where: { userId: userIdNumber },
            include: {
                shop: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 30 // Get up to 30 most recent incoming
        });
        // Get outgoing transactions (UserToShop) - coins sent
        const outgoingTransactions = yield index_1.prisma.userToShopCoin.findMany({
            where: { userId: userIdNumber },
            include: {
                shop: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 30 // Get up to 30 most recent outgoing
        });
        // Transform and combine transactions
        const allTransactions = [
            // Incoming transactions (green arrows)
            ...incomingTransactions.map(transaction => ({
                id: `incoming-${transaction.id}`,
                type: 'incoming',
                amount: transaction.volume,
                shopName: transaction.shop.name,
                shopImage: transaction.shop.image,
                date: transaction.createdAt.toISOString().split('T')[0],
                createdAt: transaction.createdAt.toISOString()
            })),
            // Outgoing transactions (red arrows)
            ...outgoingTransactions.map(transaction => ({
                id: `outgoing-${transaction.id}`,
                type: 'outgoing',
                amount: transaction.volume,
                shopName: transaction.shop.name,
                shopImage: transaction.shop.image,
                date: transaction.createdAt.toISOString().split('T')[0],
                createdAt: transaction.createdAt.toISOString()
            }))
        ];
        // Sort by creation date (most recent first) and limit to 60
        const sortedTransactions = allTransactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 60);
        return res.status(200).json({
            success: true,
            userCoins: user.coinsAvailable || 0,
            transactions: sortedTransactions,
            totalTransactions: sortedTransactions.length
        });
    }
    catch (error) {
        console.error("Error fetching wallet transactions:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "Failed to fetch wallet transactions"
        });
    }
}));
// Backend route for user profile
exports.userRouter.post("/profile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        // Parse userId to integer
        const userIdInt = parseInt(userId);
        if (isNaN(userIdInt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID format"
            });
        }
        // Fetch user data from database using Prisma
        const userData = yield index_1.prisma.user.findUnique({
            where: {
                id: userIdInt
            },
            select: {
                id: true,
                name: true,
                username: true,
                phone: true,
                pin: true,
                localArea: true,
                coinsAvailable: true,
                createdAt: true,
                updatedAt: true,
                // Exclude sensitive data like password
                // password: false (already excluded by not including it in select)
            }
        });
        // Check if user exists
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Return user data
        return res.status(200).json({
            success: true,
            data: userData,
            message: "User profile fetched successfully"
        });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            //@ts-ignore
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
exports.userRouter.post("/update-profile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, name, pin, localArea } = req.body;
        console.log('Update profile request:', { userId, name, pin, localArea });
        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        // Parse userId to integer
        const userIdInt = parseInt(userId);
        if (isNaN(userIdInt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID format"
            });
        }
        // Validate required fields
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }
        // Check if user exists
        const existingUser = yield index_1.prisma.user.findUnique({
            where: { id: userIdInt }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Prepare update data
        const updateData = {
            name: name.trim(),
            updatedAt: new Date()
        };
        // Only update pin if provided and not empty
        if (pin !== null && pin !== undefined && pin.trim() !== '') {
            updateData.pin = pin.trim();
        }
        // Only update localArea if provided and not empty
        if (localArea !== null && localArea !== undefined && localArea.trim() !== '') {
            updateData.localArea = localArea.trim();
        }
        console.log('Update data:', updateData);
        // Update user data
        const updatedUser = yield index_1.prisma.user.update({
            where: {
                id: userIdInt
            },
            data: updateData,
            select: {
                id: true,
                name: true,
                username: true,
                phone: true,
                pin: true,
                localArea: true,
                coinsAvailable: true,
                createdAt: true,
                updatedAt: true
            }
        });
        console.log('Updated user:', updatedUser);
        return res.status(200).json({
            success: true,
            data: updatedUser,
            message: "Profile updated successfully"
        });
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            //@ts-ignore
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
exports.userRouter.post("/coin-history", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        // Parse userId to integer
        const userIdInt = parseInt(userId);
        if (isNaN(userIdInt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID format"
            });
        }
        // Fetch coin transactions - both sent and received
        const [coinsSent, coinsReceived] = yield Promise.all([
            index_1.prisma.userToShopCoin.findMany({
                where: { userId: userIdInt },
                include: {
                    shop: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            index_1.prisma.shopToUserCoin.findMany({
                where: { userId: userIdInt },
                include: {
                    shop: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);
        // Format the transactions
        const transactions = [
            ...coinsSent.map(tx => ({
                id: tx.id,
                type: 'SENT',
                volume: tx.volume,
                shopName: tx.shop.name,
                shopId: tx.shop.id,
                createdAt: tx.createdAt
            })),
            ...coinsReceived.map(tx => ({
                id: tx.id,
                type: 'RECEIVED',
                volume: tx.volume,
                shopName: tx.shop.name,
                shopId: tx.shop.id,
                createdAt: tx.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.status(200).json({
            success: true,
            data: {
                transactions,
                totalSent: coinsSent.reduce((sum, tx) => sum + tx.volume, 0),
                totalReceived: coinsReceived.reduce((sum, tx) => sum + tx.volume, 0)
            },
            message: "Coin history fetched successfully"
        });
    }
    catch (error) {
        console.error("Error fetching coin history:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            //@ts-ignore
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
exports.userRouter.post("/shop-coins", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        // Get all shops the user has received coins from
        const coinsReceived = yield index_1.prisma.shopToUserCoin.findMany({
            where: {
                userId: parseInt(userId)
            },
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        // Group by shop and calculate available coins
        const shopCoins = {};
        for (const coinRecord of coinsReceived) {
            const shopId = coinRecord.shopId;
            //@ts-ignore
            if (!shopCoins[shopId]) {
                //@ts-ignore
                shopCoins[shopId] = {
                    shopName: coinRecord.shop.name,
                    received: 0,
                    used: 0,
                    available: 0
                };
            }
            //@ts-ignore
            shopCoins[shopId].received += coinRecord.volume;
        }
        // Calculate used coins for each shop (ONLY from UserToShopCoin table)
        for (const shopId of Object.keys(shopCoins)) {
            const coinsUsed = yield index_1.prisma.userToShopCoin.aggregate({
                where: {
                    userId: parseInt(userId),
                    shopId: parseInt(shopId)
                },
                _sum: {
                    volume: true
                }
            });
            const used = parseInt(coinsUsed._sum.volume) || 0;
            //@ts-ignore
            shopCoins[shopId].used = used;
            //@ts-ignore
            shopCoins[shopId].available = shopCoins[shopId].received - used;
        }
        // Convert to the format expected by frontend (shopId -> available coins)
        const formattedShopCoins = {};
        for (const [shopId, data] of Object.entries(shopCoins)) {
            //@ts-ignore
            formattedShopCoins[shopId] = data.available;
        }
        return res.status(200).json({
            success: true,
            shopCoins: formattedShopCoins
        });
    }
    catch (error) {
        console.error('Error fetching shop coins:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching shop coins'
        });
    }
}));
