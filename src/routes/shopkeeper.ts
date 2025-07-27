import express from 'express';
import 'dotenv/config'
import jwt from "jsonwebtoken";
import {prisma} from '../index';
import { boolean, promise, z } from "zod";
import bcrypt from 'bcrypt';
import { TypePredicateKind } from 'typescript';
const app = express();
const cron = require('node-cron');
app.use(express.json());
export const shopRouter =  express.Router();
// signup for buisnessman
 shopRouter.post("/signup", async (req , res) : Promise <any>  =>{
    
     const {name , username , password , phoneNumber} = req.body;
     const user = z.object({
       name :z.string().min(3).max(100),
      username : z.string(),
       password : z.string().min(5).max(16)
 
       
   });
 const bul = user.safeParse(req.body);
 if(!bul.success){
   // bul.error.errors
   return res.status(400).json({ message : "invalid input"  });
 };
     
 
 try {
      const already =  await  prisma.shopKeeper.findFirst({
       where : {
         phone : phoneNumber
       }
      });
 
      if(already){
       return res.status(400).json({message : "phone number already registered"});
 
      }
 } catch(e){
   console.error("error " + e);
 };
 
 try {
   const already = await prisma.shopKeeper.findFirst({
     where : {
       username 
     }
   })
   if(already){
     return res.status(400).json({message : "username already taken "});
   }
 } catch(e){
   console.error("error " + e);
 }
 
 
 
 
 try{
  const hashedpass =   await bcrypt.hash(password , 3);
   await prisma.shopKeeper.create({
   data  : {
     name : name,
     username : username, 
     password : hashedpass, 
     phone : phoneNumber, 
   
   }
  }
  )
  console.log("user signed up")    ;
     
 
 
   res.status(200).json({
       message : "you are succesfully signed up ",
   })
 }
 catch(e){
   res.json({
       message : "an error while hashing the password ",
   });
 }
 
      
     
 
  });
  
//sinup for signin
shopRouter.post("/signin", async (req, res) : Promise <any> =>{

   const {  userInput , password } = req.body ; 
   let  foundUser = null; 



   console.log(userInput, password);

   if(userInput.length<10){
     foundUser  = await prisma.shopKeeper.findUnique({
      where : {
        
          username : userInput , 
        
      }
     })
   }else {
     foundUser = await prisma.shopKeeper.findUnique({
      where : {
        phone : userInput,
        

      }
     });

    }

    if(!foundUser){
        return res.status(500).json({message  : "user not found"});
    }

     const validpass = await  bcrypt.compare(password , foundUser.password);
       if(!validpass){
        return res.status(500).json({message : "invalid password"});

       };

       const jwt_pass = process.env.buis_secret ;

       if(!jwt_pass){
        return ; 

       };
       let shopId; 
       try {

         shopId = await prisma.shop.findFirst({
          where : {
            ownerId : foundUser.id
          },
          select : {
            id : true
          }
         });

       }catch(e){
        console.error(e);
        return res.status(500).json({message : "shopId not found"});

       };
       if(!shopId){
        return res.json({message : "error while getting shopId"});
       }
        
       const token = jwt.sign({id : foundUser.id , shopId : shopId?.id}, jwt_pass);
       res.status(200).json({ token , shopId : shopId.id, ownerId : foundUser.id     } ); 
})
// no phone or username taken 
 shopRouter.post("/validate",  async (req, res) : Promise <any>=>{
    const { 
      username,
      phoneNumber
    
    }  = req.body;
     

    try {
        
    const alreadyUsername = await prisma.shopKeeper.findFirst({where : {
      username 
    }});

    if(alreadyUsername){
      
      return res.status(200).json({usernameExists : true, phoneExists: false});
    }

    const alreadyPhone = await prisma.shopKeeper.findFirst({
      where : {
        phone : phoneNumber
      }
    });
    if(alreadyPhone){
      return res.status(200).json({usernameExists: false, phoneExists:true});

    }

    return res.status(200).json({usernameExists: false, phoneExists:false});
    


    }catch(e){
      console.log(e);
      return res.status(400).json({message  : "error while validating"});


    }
     
    
    

 })
// route to chnge the password 
shopRouter.post("/updatepass", async(req, res)  : Promise<any> =>{
  const {phoneNumber, newPassword} = req.body;
  

  const already = await prisma.shopKeeper.findFirst({
    where : {
      phone : phoneNumber
    }
  });

  if(already){
    try {
       const hash = await bcrypt.hash(newPassword , 3);

      await prisma.shopKeeper.update({
        // @ts-ignore
        where: {
          //@ts-ignore
          phone : phoneNumber,
        },
        data: {
          password: hash,
        },
      });
      console.log("db updated");
      return res.status(200).json({message : "password updated succefully"});

    }catch(e : any ){
      console.log("error while updating db" + e.message);
    };
   


  }
  else {
    return res.status(400).json({messsage :"user not found "});
  }


});
   // returns the shopkeeper  id  by taking phone 
shopRouter.post("/id" , async (req, res )  : Promise <any> =>{
  const {phone} = req.body;
let keeper ; 
try {
   keeper = await prisma.shopKeeper.findFirst({
    where : {
      phone :phone, 
    }
  });


}catch(e){
  console.log(e);
}
  
  return res.status(200).json({message : keeper?.id});

});

// creates the shop information , by taking pin localARea ... 
shopRouter.post("/info", async (req, res): Promise<any> => {
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

    const shop = await prisma.shop.create({
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

  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Error while adding info" });
  }
});

// Create promotion route
shopRouter.post('/create-promotion', async (req, res) : Promise<any> => {
  try {
    const { title, message, shopId, shopKeeperId } = req.body;

    // Validate required fields
    if (!title || !message || !shopId || !shopKeeperId) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, message, shopId, and shopKeeperId are required' 
      });
    }

    // Validate that the shop exists and belongs to the shopkeeper
    const shop = await prisma.shop.findFirst({
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
    const newPromotion = await prisma.adver.create({
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

  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ 
      error: 'Failed to create promotion', 
      details: (error as Error).message
    });
  }
});
// get the promotion information 
shopRouter.get("/promotions/:shopId", async (req, res) : Promise <any> => {
  const shopId = parseInt(req.params.shopId);
  if(!shopId){
    return res.status(400).json({message : "missing shopId"});
  }

  if (isNaN(shopId)) {
    return res.status(400).json({ message: "Invalid Shop ID" });
  }

  try {
    const promotion = await prisma.adver.findFirst({
      where: {
        shopId: shopId,
        // You might have a status field (e.g., 'active') to ensure you fetch only active promotions
        // status: 'active',
      },
      select: {
        title: true,
        message: true,
        image: true, 
        views : true,
        clicks : true ,
        
      },
      orderBy: {
        createdAt: 'desc', // Assuming you want the most recent active promotion
      },
    });

    if (promotion) {
      return res.status(200).json(promotion);
    } else {
      return res.status(404).json({ message: "No active promotion found for this shop." });
    }
  } catch (e) {
    console.error("Error fetching promotion details:", e);
    return res.status(500).json({ message: "Error fetching promotion details" });
  }
});
// Delete promotion
shopRouter.delete('/delete-promotion/:id', async (req, res) : Promise<any> => {
  try {
    console.log("delete hitted");
    const { id } = req.params;

    const promotion = await prisma.adver.findUnique({
      where: { id: parseInt(id) }
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    await prisma.adver.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ 
      error: 'Failed to delete promotion', 
      details: (error as Error).message
    });
  }
});
// check if already adver going 
shopRouter.post("/already", async (req, res) : Promise<any> =>{
  const {shopId} = req.body; 
  let shop = parseInt(shopId);
  try {
    const present = await prisma.adver.findFirst({
      where : {
        shopId : shop
      }
    });
    if(present){
      return res.status(200).json({message : 1})
    }
    else {
      return res.status(200).json({message : 0});
  
    }

  }catch(e){
    console.error(e);
    return res.status(404).json({error : "error occured while db call"});
  }
 
    
});
//return product and consumer details for the   shop
// shopRouter.post("/orders", async (req , res) : Promise <any> =>{
//   const {shopId} = req.body;
  
//   try {
//     // Get order groups with their associated orders
//     const orderGroups = await prisma.orderGroup.findMany({
//       where : {
//         shopId : parseInt(shopId)
//       },
//       include : {
//         user : {
//           select : {
//             id : true,
//             name : true,
//             username: true,
//           }
//         },
//         orders: {
//           include: {
//             product : {
//               select : {
//                 id : true,
//                 name : true,
//                 price : true,
//                 image : true,
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     // Flatten the structure to match the old format
//      //@ts-ignore
//     const orders = [];
//     orderGroups.forEach(orderGroup => {
//       orderGroup.orders.forEach(order => {
//         orders.push({
//           id: order.id,
//           soldToId: orderGroup.userId,
//           productId: order.productId,
//           createdAt: order.createdAt,
//           updatedAt: order.updatedAt,
//           quantity: order.quantity,
//           shopId: orderGroup.shopId,
//           status: orderGroup.status,
//           soldOffline: orderGroup.soldOffline,
//           consumer: orderGroup.user,
//           product: order.product,
//           orderGroupId: orderGroup.id,
//           totalAmount: orderGroup.totalAmount,
//           coinsUsed: orderGroup.coinsUsed,
//           unitPrice: order.unitPrice
//         });
//       });
//     });
//  //@ts-ignore
//     return res.status(200).json({message : orders});
//   } catch(e) {
//     console.error(e + " error occurred");
//     return res.status(502).json({message : "error while db call"});
//   }
// });

// shopRouter.post("/orders", async (req, res) : Promise<any> => {
//   const { shopId } = req.body;
  
//   try {
//     // Get order groups with their associated orders
//     const orderGroups = await prisma.orderGroup.findMany({
//       where: {
//         shopId: parseInt(shopId)
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             phone: true,
//             localArea: true
//           }
//         },
//         shop: {
//           select: {
//             id: true,
//             name: true,
//             tagline: true,
//             coinValue: true,
//             localArea: true
//           }
//         },
//         orders: {
//           include: {
//             product: {
//               select: {
//                 id: true,
//                 name: true,
//                 price: true,
//                 image: true,
//               }
//             },
//             offer: {
//               select: {
//                 id: true,
//                 type: true,
//                 title: true,
//                 description: true,
//                 percentage: true,
//                 fixed: true,
//                 coinValue: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     // Transform order groups to include calculated totals and offer applications
//     const transformedOrderGroups = orderGroups.map(orderGroup => {
//       let subtotal = 0;
//       let totalDiscount = 0;
//       //@ts-ignore
//       let freeProducts = [];
      
//       const processedOrders = orderGroup.orders.map(order => {
//         const product = order.product;
//         const offer = order.offer;
//         let itemTotal = order.unitPrice * order.quantity;
//         let itemDiscount = 0;
//         let isFree = false;

//         // Apply offers
//         if (offer) {
//           switch (offer.type) {
//             case 'product':
//               // Free product offer
//               isFree = true;
//               itemTotal = 0;
//               freeProducts.push({
//                 ...product,
//                 quantity: order.quantity,
//                 offerTitle: offer.title
//               });
//               break;
              
//             case 'percentage':
//               // Percentage discount
//                 //@ts-ignore
//               itemDiscount = (itemTotal * offer.percentage) / 100;
//               itemTotal = itemTotal - itemDiscount;
//               break;
              
//             case 'money':
//               // Fixed amount discount
//               itemDiscount = Math.min(offer.fixed || 0, itemTotal);
//               itemTotal = itemTotal - itemDiscount;
//               break;
//           }
//         }

//         if (!isFree) {
//           subtotal += itemTotal;
//         }
//         totalDiscount += itemDiscount;

//         return {
//           ...order,
//           product,
//           offer,
//           itemTotal: Math.round(itemTotal * 100) / 100, // Round to 2 decimal places
//           itemDiscount: Math.round(itemDiscount * 100) / 100,
//           isFree
//         };
//       });

//       // Calculate coin discount if coins were used
//       let coinDiscount = 0;
//       if (orderGroup.coinsUsed > 0) {
//         const coinValue = orderGroup.shop.coinValue; // Value of 100 coins
//         const singleCoinValue = coinValue / 100;
//         coinDiscount = orderGroup.coinsUsed * singleCoinValue;
//       }

//       const finalTotal = Math.round(subtotal - coinDiscount);
      
//       // Calculate coins to be credited (0.1 coins per rupee, minimum 1 coin)
//       const coinsToCredit = Math.floor(finalTotal * 0.1);

//       return {
//         id: orderGroup.id,
//         userId: orderGroup.userId,
//         shopId: orderGroup.shopId,
//         status: orderGroup.status,
//         createdAt: orderGroup.createdAt,
//         updatedAt: orderGroup.updatedAt,
//         soldOffline: orderGroup.soldOffline,
//         consumer: orderGroup.user,
//         shop: orderGroup.shop,
//         orders: processedOrders,
//           //@ts-ignore
//         freeProducts,
//         subtotal: Math.round(subtotal * 100) / 100,
//         totalDiscount: Math.round(totalDiscount * 100) / 100,
//         coinsUsed: orderGroup.coinsUsed,
//         coinDiscount: Math.round(coinDiscount * 100) / 100,
//         finalTotal,
//         coinsToCredit: coinsToCredit >= 1 ? coinsToCredit : 0
//       };
//     });

//     return res.status(200).json({ message: transformedOrderGroups });
//   } catch (e) {
//     console.error(e + " error occurred");
//     return res.status(502).json({ message: "error while db call" });
//   }
// })
// Updated route for changing order status
// shopRouter.put("/orders/update-status", async (req, res) : Promise <any> => {
//   const { orderId, status } = req.body;

//   try {
//     // First find the order to get its orderGroupId
//     const order = await prisma.order.findUnique({
//       where: { id: parseInt(orderId) },
//       select: { orderGroupId: true }
//     });

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Update the status in the OrderGroup (since status is stored there)
//     const updatedOrderGroup = await prisma.orderGroup.update({
//       where: { id: order.orderGroupId },
//       data: { status: status }
//     });

//     // Get the updated order with its group info for response
//     const updatedOrder = await prisma.order.findUnique({
//       where: { id: parseInt(orderId) },
//       include: {
//         orderGroup: {
//           select: {
//             status: true,
//             totalAmount: true,
//             coinsUsed: true
//           }
//         }
//       }
//     });

//     return res.status(200).json({ 
//       message: "Order status updated", 
//       order: updatedOrder,
//       orderGroup: updatedOrderGroup
//     });
//   } catch (error) {
//     console.error("Error updating order status:", error);
//     return res.status(500).json({ error: "Failed to update order status" });
//   }
// });
shopRouter.post('/analytics', async (req, res) : Promise <any> => {
  try {
    const { shopId } = req.body;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get top selling items with total quantities sold (only CONFIRMED and COMPLETED orders)
    // Since shopId is now in OrderGroup, we need to join through OrderGroup
    const topSellingItems = await prisma.order.groupBy({
      by: ['productId'],
      where: {
        orderGroup: {
          shopId: parseInt(shopId),
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
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
    });

    // Get product details for the top selling items
    const productIds = topSellingItems.map(item => item.productId);
    const products = await prisma.product.findMany({
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
        productName: product?.name || 'Unknown Product',
        productImage: product?.image,
        productPrice: product?.price || 0,
        totalQuantitySold: item._sum.quantity || 0,
        totalOrders: item._count.id || 0,
        totalRevenue: (product?.price || 0) * (item._sum.quantity || 0),
      };
    });

    // 2. Get coins given by the shop in last 30 days
    const coinsGiven = await prisma.shopToUserCoin.findMany({
      where: {
        shopId: parseInt(shopId),
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        volume: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total coins given (volume is now an integer, not string)
    const totalCoinsGiven = coinsGiven.reduce((sum, coin) => {
      return sum + (coin.volume || 0);
    }, 0);

    // Get detailed coin transactions for the chart
    const coinTransactions = coinsGiven;

    // 3. Get total accepted orders in last 30 days
    // Now we need to aggregate from OrderGroup instead of Order directly
    const acceptedOrderGroups = await prisma.orderGroup.aggregate({
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

    // Get total quantity from orders in accepted order groups
    const acceptedOrdersQuantity = await prisma.order.aggregate({
      where: {
        orderGroup: {
          shopId: parseInt(shopId),
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Get daily order counts for chart from OrderGroup
    const dailyOrderGroups = await prisma.orderGroup.groupBy({
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
    const ordersByDate: Record<string, number> = dailyOrderGroups.reduce((acc, orderGroup) => {
      const date = orderGroup.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + orderGroup._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get shop details
    const shopDetails = await prisma.shop.findUnique({
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
        totalOrdersAccepted: acceptedOrderGroups._count.id || 0,
        totalCoinsGiven: totalCoinsGiven,
        totalCoinTransactions: coinsGiven.length,
      },
      topSellingProducts: topSellingData,
      coinTransactions: coinTransactions.map(tx => ({
        amount: tx.volume,
        date: tx.createdAt,
        recipientName: tx.user.name,
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

  } catch (error) {
    console.error('Shop analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop analytics',
      details: errorMessage,
    });
  }
});


shopRouter.get('/products/:shopId', async (req, res): Promise<any> => {
  try {
    const { shopId } = req.params;
    
    const shopIdInt = parseInt(shopId);
    if (isNaN(shopIdInt)) {
      return res.status(400).json({ 
        message: 'Invalid shop ID format' 
      });
    }

    const products = await prisma.product.findMany({
      where: { shopId: shopIdInt },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      products: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products'
    });
  }
});

// POST /shop/products - Create a new product
shopRouter.post('/products', async (req, res): Promise<any> => {
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
    const newProduct = await prisma.product.create({
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

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      message: 'Failed to add product'
    });
  }
});

// PUT /shop/products/:productId - Update product price and quantity
shopRouter.put('/products/:productId', async (req, res): Promise<any> => {
  try {
    const { productId } = req.params;
    const { price, quantity } = req.body;

    const productIdInt = parseInt(productId);
    if (isNaN(productIdInt)) {
      return res.status(400).json({ 
        message: 'Invalid product ID format' 
      });
    }

    const updateData: any = {};

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
    const updatedProduct = await prisma.product.update({
      where: { id: productIdInt },
      data: updateData
    });

    res.status(200).json({
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Failed to update product'
    });
  }
});

// DELETE /shop/products/:productId - Delete a product
shopRouter.delete('/products/:productId', async (req, res): Promise<any> => {
  try {
    const { productId } = req.params;

    const productIdInt = parseInt(productId);
    if (isNaN(productIdInt)) {
      return res.status(400).json({ 
        message: 'Invalid product ID format' 
      });
    }

    // Delete associated cart items first (if any)
    await prisma.cart.deleteMany({
      where: { productId: productIdInt }
    });

    // Delete the product
    await prisma.product.delete({
      where: { id: productIdInt }
    });

    res.status(200).json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      message: 'Failed to delete product'
    });
  }
});


shopRouter.post('/products/bulk', async (req, res): Promise<any> => {
  try {
    const { products } = req.body;

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Products array is required and must contain at least one product'
      });
    }

    // Define interface for validated product
    interface ValidatedProduct {
      name: string;
      price: number;
      quantity: number;
      shopId: number;
      canBePurchasedByCoin: boolean;
    }

    // Validate each product
    const validatedProducts: ValidatedProduct[] = [];
    const errors: string[] = [];

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
    const shopIds: number[] = [...new Set(validatedProducts.map((p: ValidatedProduct) => p.shopId))];
    const existingShops = await prisma.shop.findMany({
      where: {
        id: {
          in: shopIds
        }
      },
      select: {
        id: true
      }
    });

    const existingShopIds: number[] = existingShops.map(shop => shop.id);
    const invalidShopIds: number[] = shopIds.filter(id => !existingShopIds.includes(id));

    if (invalidShopIds.length > 0) {
      return res.status(404).json({
        message: 'Invalid shop IDs found',
        invalidShopIds: invalidShopIds
      });
    }

    // Check for duplicate product names within the same shop (case-insensitive)
    const duplicateErrors: string[] = [];
    
    // Check for duplicates within the current request
    const productNamesByShop = new Map<number, Set<string>>();
    
    validatedProducts.forEach((product, index) => {
      const shopId = product.shopId;
      const productName = product.name.toLowerCase();
      
      if (!productNamesByShop.has(shopId)) {
        productNamesByShop.set(shopId, new Set());
      }
      
      const shopProducts = productNamesByShop.get(shopId)!;
      if (shopProducts.has(productName)) {
        duplicateErrors.push(`Product ${index + 1}: Duplicate product name '${product.name}' found in the same shop within this request`);
      } else {
        shopProducts.add(productName);
      }
    });

    // Check for existing products in the database with same names (case-insensitive)
    const existingProducts = await prisma.product.findMany({
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
    const existingProductsByShop = new Map<number, Set<string>>();
    existingProducts.forEach(product => {
      const shopId = product.shopId;
      const productName = product.name.toLowerCase();
      
      if (!existingProductsByShop.has(shopId)) {
        existingProductsByShop.set(shopId, new Set());
      }
      
      existingProductsByShop.get(shopId)!.add(productName);
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
    const createdProducts = await prisma.$transaction(async (prisma) => {
      const results = [];
      
      for (const productData of validatedProducts) {
        const newProduct = await prisma.product.create({
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
    });

    res.status(201).json({
      message: `Successfully created ${createdProducts.length} products`,
      products: createdProducts,
      count: createdProducts.length
    });

  } catch (error: any) {
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
});



shopRouter.get('/:id', async (req, res): Promise<any> => {
  try {
    const shopId = parseInt(req.params.id);
    
    const shop = await prisma.shop.findUnique({
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
  } catch (error) {
    console.error('Error fetching shop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /shop/:id - Update shop information
shopRouter.put('/:id', async (req, res): Promise<any> => {
  try {
    const shopId = parseInt(req.params.id);
    const { name, tagline, pin, localArea, coinValue, opens, closes } = req.body;

    const updatedShop = await prisma.shop.update({
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
  } catch (error) {
    console.error('Error updating shop:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cron job to reactivate all shops daily (run at midnight)


cron.schedule('0 0 * * *', async () => {
  try {
    await prisma.shop.updateMany({
      where: { isActive: false },
      data: { isActive: true }
    });
    console.log('All shops reactivated for the new day');
  } catch (error) {
    console.error('Error reactivating shops:', error);
  }
});


// PATCH /shop/:id/toggle-status
shopRouter.patch('/:id/toggle-status', async (req, res) : Promise <any> => {
  try {
    const shopId = parseInt(req.params.id);
    
    // Get current shop status  
    const currentShop = await prisma.shop.findUnique({
      where: { id: shopId }
    });
    
    if (!currentShop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    // Toggle the isActive status
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { 
        isActive: !currentShop.isActive 
      },
      include: {
        owner: true
      }
    });
    
    res.json(updatedShop);
  } catch (error) {
    console.error('Error toggling shop status:', error);
    res.status(500).json({ error: 'Failed to toggle shop status' });
  }
});





// GET /shop/:shopId/products - Fetch all products for a specific shop
shopRouter.get('/:shopId/products', async (req : any , res : any ) => {
  try {
    const shopId = parseInt(req.params.shopId);
    
    if (isNaN(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const products = await prisma.product.findMany({
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
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /shop/:shopId/update-inventory - Update product quantities after billing
// Updated route for updating inventory
shopRouter.post('/:shopId/update-inventory', async (req : any , res : any ) => {
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
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        ownerId: parseInt(ownerId)
      }
    });

    if (!shop) {
      return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
    }

    // Calculate total amount for the order group
    let totalAmount = 0;
    const orderData = [];

    // Validate all items first and calculate total
    for (const item of items) {
      const productId = parseInt(item.productId);
      const quantityToReduce = parseInt(item.quantity);

      if (isNaN(productId) || isNaN(quantityToReduce) || quantityToReduce <= 0) {
        throw new Error(`Invalid product ID or quantity for item: ${JSON.stringify(item)}`);
      }

      const currentProduct = await prisma.product.findFirst({
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

      totalAmount += currentProduct.price * quantityToReduce;
      orderData.push({
        productId,
        quantityToReduce,
        currentProduct,
        unitPrice: currentProduct.price
      });
    }

    // Create order group for offline sale
    const orderGroup = await prisma.orderGroup.create({
      data: {
        userId: null, // null since it's an offline sale
        shopId: shopId,
        totalAmount: totalAmount,
        coinsUsed: 0,
        status: 'COMPLETED',
        soldOffline: true
      }
    });

    // Process all items
    const updatedProducts = [];
    for (const item of orderData) {
      // Update product quantity
      const updatedProduct = await prisma.product.update({
        where: {
          id: item.productId
        },
        data: {
          quantity: item.currentProduct.quantity - item.quantityToReduce
        }
      });

      // Create individual order record
      await prisma.order.create({
        data: {
          orderGroupId: orderGroup.id,
          productId: item.productId,
          quantity: item.quantityToReduce,
          unitPrice: item.unitPrice
        }
      });

      updatedProducts.push({
        id: updatedProduct.id,
        name: updatedProduct.name,
        newQuantity: updatedProduct.quantity
      });
    }

    return res.status(200).json({
      message: 'Inventory updated successfully and orders created',
      updatedProducts: updatedProducts,
      orderGroupId: orderGroup.id
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    return res.status(500).json({
      error: 'Failed to update inventory',
      // @ts-ignore
      details: error.message
    });
  }
});


// GET /shop/:shopId - Get shop details
shopRouter.get('/:shopId', async (req: any , res : any ) => {
  try {
    const shopId = parseInt(req.params.shopId);
    
    if (isNaN(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shop = await prisma.shop.findUnique({
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
  } catch (error) {
    console.error('Error fetching shop details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /shop/:shopId/products - Add new product to shop
shopRouter.post('/:shopId/products', async (req :any , res: any ) => {
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
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        ownerId: parseInt(ownerId)
      }
    });

    if (!shop) {
      return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
    }

    const newProduct = await prisma.product.create({
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
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /shop/:shopId/products/:productId - Update product
shopRouter.put('/:shopId/products/:productId', async (req : any , res : any ) => {
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
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        ownerId: parseInt(ownerId)
      }
    });

    if (!shop) {
      return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
    }

    // Verify product belongs to shop
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        shopId: shopId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found in this shop' });
    }

    const updatedProduct = await prisma.product.update({
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
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /shop/:shopId/products/:productId - Delete product
shopRouter.delete('/:shopId/products/:productId', async (req : any , res : any ): Promise <any> => {
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
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        ownerId: parseInt(ownerId)
      }
    });

    if (!shop) {
      return res.status(403).json({ error: 'Unauthorized: Shop not found or access denied' });
    }

    // Verify product belongs to shop
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        shopId: shopId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found in this shop' });
    }

    await prisma.product.delete({
      where: {
        id: productId
      }
    });

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

shopRouter.get('/:shopId/orders', async (req : any , res : any ) : Promise <any>=> {
  try {
    const shopId = parseInt(req.params.shopId);
    
    if (isNaN(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    // Get order groups with their associated orders
    const orderGroups = await prisma.orderGroup.findMany({
      where: {
        shopId: shopId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true
          }
        },
        orders: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Flatten the structure to match the old format
    //@ts-ignore
    const orders = [];
    orderGroups.forEach(orderGroup => {
      orderGroup.orders.forEach(order => {
        orders.push({
          id: order.id,
          soldToId: orderGroup.userId,
          productId: order.productId,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          quantity: order.quantity,
          shopId: orderGroup.shopId,
          status: orderGroup.status,
          soldOffline: orderGroup.soldOffline,
          consumer: orderGroup.user,
          product: order.product,
          orderGroupId: orderGroup.id,
          totalAmount: orderGroup.totalAmount,
          coinsUsed: orderGroup.coinsUsed
        });
      });
    });
 //@ts-ignore
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


shopRouter.post("/feedback", async (req, res): Promise<any> => {
  const {ownerId,
    feedbackType,
     
    title,
    description,
    timestamp} = req.body; 
    if(  !feedbackType || !title || !description || !timestamp ){
      return res.json({message : 'informatin missing'});

    }
     
    try {
       const response =  await  prisma.feedback.create({
        data : {
          ownerId ,
          feedbackType,
          title,
          description ,
          time : timestamp

        }
       });
       res.status(200).json({message : "got it "})
    }catch(e){
      return res.json({error : e});

    }


});

  shopRouter.post("/shopname", async(req, res) : Promise <any> =>{
    const {shopId} = req.body;

    try {
      const shopName = await prisma.shop.findFirst({
        where : {
          id : parseInt(shopId)
        },
        select : {
          name : true,
          tagline : true,
        }
      });

      return res.status(201).json({message : shopName?.name, tagline :shopName?.tagline})
    
    

    }catch(e: any){
      console.error(e.message);
      return res.status(502).json({message : "error occured while getting the shopName"}) ;
    };


  } )




  shopRouter.post("/own/already", async (req, res) : Promise<any> =>{
    const {storedownerIds} = req.body;
    let ankush = 0;
    

    try {
      const ispresent = await prisma.shopKeeper.findFirst({

      where : {
        id : storedownerIds
      }
    });
    
    if(ispresent){
      ankush = 1; 
    }



    }catch(e){
       console.error(e);
      return res.status(500).json({error : "error while checking db "});
     
      


    }
    
    return res.status(200).json({message : ankush, islive : "yes"});



  })


  shopRouter.post("/isverified", async  (req, res ) : Promise<any> =>{
    const {ownerId} = req.body;
    
     let x = false;

    let a; 
    try {

        a = await prisma.shopKeeper.findFirst({
      where : {
        id : parseInt(ownerId)  
      }, 
      select: {
        verified: true
      }
    });
    }catch(e){
      console.error(e);
      return res.status(404).json({message :"error "});


    }

    if(a){
      x = a.verified;

    }else{
      return res.status(200).json({message : "user not found in the db"});

    }
    
    return res.status(200).json({message : x});

    
   


  })

  
  enum OfferType {
  product ,
  money ,
  percentage 

}
// GET route to fetch offers for a specific shop (updated to include product details)
shopRouter.get("/:shopId/offers", async (req, res): Promise<any> => {
  const { shopId } = req.params;
  
  if (!shopId) {
    return res.status(400).json({ message: "shopId not found" });
  }
  
  try {
    const offers = await prisma.offer.findMany({
      where: {
        shop: parseInt(shopId)
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true
          }
        }
      }
    });
   
    
    return res.status(200).json(offers);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "error while fetching the offers" });
  }
});
// POST route to create offer (matches frontend expectation)
shopRouter.post("/:shopId/offers", async (req, res): Promise<any> => {
  const { shopId } = req.params;
  const { type, fixed, title, product, percentage, description, minimum_amount, coinValue } = req.body;
  
  if (!shopId) {
    return res.status(400).json({ message: "shopId not found" });
  }
  
  try {
    const offer = await prisma.offer.create({
      data: {
        type,
        title,
        description,
        minimum_amount,
        shop: parseInt(shopId),
        product: product ? parseInt(product) : null,
        percentage: percentage ? parseInt(percentage) : null,
        fixed: fixed ? parseInt(fixed) : null,
        coinValue: coinValue ? parseInt(coinValue) : null
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true
          }
        }
      }
    });
    
    return res.status(201).json({ message: "created successfully", offer });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "error while creating the offer" });
  }
});

shopRouter.put("/:shopId/offers/:offerId", async (req, res): Promise<any> => {
  const { shopId, offerId } = req.params;
  const { type, fixed, title, product, percentage, description, minimum_amount, coinValue } = req.body;
  
  if (!shopId || !offerId) {
    return res.status(400).json({ message: "shopId or offerId not found" });
  }
  
  try {
    // First check if the offer exists and belongs to the shop
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: parseInt(offerId),
        shop: parseInt(shopId)
      }
    });
    
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found or doesn't belong to this shop" });
    }
    
    const updatedOffer = await prisma.offer.update({
      where: {
        id: parseInt(offerId)
      },
      data: {
        type,
        title,
        description,
        minimum_amount,
        product: product ? parseInt(product) : null,
        percentage: percentage ? parseInt(percentage) : null,
        fixed: fixed ? parseInt(fixed) : null,
        coinValue: coinValue ? parseInt(coinValue) : null
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true
          }
        }
      }
    });
    
    return res.status(200).json({ message: "updated successfully", offer: updatedOffer });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "error while updating the offer" });
  }
});
// DELETE route to delete an offer
shopRouter.delete("/:shopId/offers/:offerId", async (req, res): Promise<any> => {
  const { shopId, offerId } = req.params;
  
  if (!shopId || !offerId) {
    return res.status(400).json({ message: "shopId or offerId not found" });
  }
  
  try {
    // First check if the offer exists and belongs to the shop
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: parseInt(offerId),
        shop: parseInt(shopId)
      }
    });
    
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found or doesn't belong to this shop" });
    }
    
    await prisma.offer.delete({
      where: {
        id: parseInt(offerId)
      }
    });
    
    return res.status(200).json({ message: "deleted successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "error while deleting the offer" });
  }
});

// GET route to fetch products for a specific shop (needed for the product dropdown)
shopRouter.get("/:shopId/products", async (req, res): Promise<any> => {
  const { shopId } = req.params;
  
  if (!shopId) {
    return res.status(400).json({ message: "shopId not found" });
  }
  
  try {
    const products = await prisma.product.findMany({
      where: {
        shopId: parseInt(shopId)  
      },
      select: {
        id: true,
        name: true,
        price: true,
        quantity: true
      }
    });
    
    return res.status(200).json(products);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "error while fetching products" });
  }
});


shopRouter.get("/:phone/present" , async (req , res) : Promise<any>=>{
   let {phone}  = req.params;
   phone = '+91' + phone;


   try {
    const present = await prisma.user.findFirst({where :{
      phone , 
    }});
    



    if(present){
      return res.status(200).json({message :1});
    }
    else {
      return res.status(200).json({message : 0});

    }
   }catch(e){
    return res.status(500).json({messsage : "error"});

   }



});


shopRouter.post("/:phone/coins", async (req, res)  : Promise <any>=> {
  try {
    let { phone } = req.params;
    let { shopId } = req.body;
    
    phone = '+91' + phone;
    shopId = parseInt(shopId);
    
    console.log("Getting coins for Phone: " + phone + ", ShopId: " + shopId);
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { phone }
    });
    
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: 0 });
    }
    
    // Get all coins earned FROM this specific shop
    const coinsEarnedFromShop = await prisma.shopToUserCoin.findMany({
      where: {
        userId: user.id,
        shopId: shopId
      }
    });
    
    // Get all coins spent AT this specific shop  
    const coinsSpentAtShop = await prisma.userToShopCoin.findMany({
      where: {
        userId: user.id,
        shopId: shopId
      }
    });
    
    // Calculate totals
    const totalEarned = coinsEarnedFromShop.reduce((sum, transaction) => sum + transaction.volume, 0);
    const totalSpent = coinsSpentAtShop.reduce((sum, transaction) => sum + transaction.volume, 0);
    const availableFromThisShop = Math.max(0, totalEarned - totalSpent);
    
    console.log(`User ${user.id} at Shop ${shopId}: Earned ${totalEarned}, Spent ${totalSpent}, Available: ${availableFromThisShop}`);
    
    return res.status(200).json({ message: availableFromThisShop });
    
  } catch (e) {
    console.error("Error while checking shop-specific coins: " + e);
    return res.status(500).json({ message: 0 });
  }
});
  
// Route 2: Update user's total coins after spending shop-specific coins
shopRouter.post("/updatecoinss", async (req, res) : Promise <any> => {
  try {
    let { updatedCoin, phone, shopId } = req.body;
    
    phone = '+91' + phone;
    updatedCoin = parseInt(updatedCoin);
    shopId = parseInt(shopId);
    
    console.log("Updating coins - Phone: " + phone + ", New total: " + updatedCoin + ", ShopId: " + shopId);
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { phone }
    });
    
    if (!user) {
      return res.status(404).json({ succ: 0 });
    }
    
    const originalTotalCoins = user.coinsAvailable || 0;
    const coinsSpent = originalTotalCoins - updatedCoin;
    
    console.log(`User ${user.id}: Original total ${originalTotalCoins}, New total: ${updatedCoin}, Coins spent: ${coinsSpent}`);
    
    // Update user's total coins
    await prisma.user.update({
      where: { phone },
      data: { coinsAvailable: updatedCoin }
    });
    
    // Record the spending transaction at this specific shop
    if (coinsSpent > 0) {
      await prisma.userToShopCoin.create({
        data: {
          userId: user.id,
          shopId: shopId,
          volume: coinsSpent
        }
      });
      console.log(`Recorded: User ${user.id} spent ${coinsSpent} coins at Shop ${shopId}`);
    }
    
    return res.status(200).json({ succ: 1 });
    
  } catch (e) {
    console.error("Error updating coins: " + e);
    return res.status(500).json({ succ: 0 });
  }
});

shopRouter.post("/addcoins", async (req, res) : Promise <any> => {
  try {
    let { phone, totalAmount, shopId } = req.body;
    
    phone = '+91' + phone;
    totalAmount = parseFloat(totalAmount);
    shopId = parseInt(shopId);
    
    // Calculate coins to add (0.1 coin per rupee, rounded down)
    const coinsToAdd = Math.floor(totalAmount * 0.1);
    
    console.log(`Adding coins for purchase - Phone: ${phone}, Amount: ${totalAmount}, Shop: ${shopId}, Coins to add: ${coinsToAdd}`);
    
    if (coinsToAdd <= 0) {
      return res.status(200).json({ 
        succ: 1, 
        message: "No coins to add (amount too small)",
        coinsAdded: 0 
      });
    }
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { phone }
    });
    
    if (!user) {
      return res.status(404).json({ succ: 0, message: "User not found" });
    }
    
    const currentTotalCoins = user.coinsAvailable || 0;
    const newTotalCoins = currentTotalCoins + coinsToAdd;
    
    // Update user's total coins
    await prisma.user.update({
      where: { phone },
      data: { 
        coinsAvailable: newTotalCoins 
      }
    });
    
    // Create entry in ShopToUserCoin table (coins earned FROM this shop)
    await prisma.shopToUserCoin.create({
      data: {
        shopId: shopId,
        userId: user.id,
        volume: coinsToAdd
      }
    });
    
    console.log(`Success: User ${user.id} earned ${coinsToAdd} coins from Shop ${shopId}. Total coins: ${currentTotalCoins} → ${newTotalCoins}`);
    
    return res.status(200).json({ 
      succ: 1, 
      message: "Coins added successfully",
      coinsAdded: coinsToAdd,
      previousTotal: currentTotalCoins,
      newTotal: newTotalCoins
    });
    
  } catch (e) {
    console.error("Error adding coins: " + e);
    return res.status(500).json({ succ: 0, message: "Error adding coins" });
  }
});

// jl

// shopRouter.post("/orders", async (req, res): Promise<any> => {
//   const { shopId } = req.body;

//   try {
//     // Get order groups with their associated orders
//     const orderGroups = await prisma.orderGroup.findMany({
//       where: {
//         shopId: parseInt(shopId)
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             phone: true,
//             localArea: true
//           }
//         },
//         shop: {
//           select: {
//             id: true,
//             name: true,
//             tagline: true,
//             coinValue: true,
//             localArea: true
//           }
//         },
//         orders: {
//           include: {
//             product: {
//               select: {
//                 id: true,
//                 name: true,
//                 price: true,
//                 image: true,
//               }
//             },
//             offer: {
//               select: {
//                 id: true,
//                 type: true,
//                 title: true,
//                 description: true,
//                 percentage: true,
//                 fixed: true,
//                 coinValue: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     // Transform order groups to include calculated totals and offer applications
//     const transformedOrderGroups = orderGroups.map(orderGroup => {
//       let totalBeforeAllOffers = 0; // NEW: Sum of (unitPrice * quantity) for all non-free items
//       let totalDiscountFromMoneyOffers = 0; // For money-type offers
//       //@ts-ignore
//       let percentageOfferApplied = null; // To track if a percentage offer exists and its value
//       //@ts-ignore
//       let freeProducts = [];

//       const processedOrders = orderGroup.orders.map(order => {
//         const product = order.product;
//         const offer = order.offer;
//         let itemBasePrice = order.unitPrice * order.quantity; // Base price for the item
//         let itemDiscount = 0;
//         let isFree = false;

//         // Add to totalBeforeAllOffers only if it's not a free product
//         if (offer?.type !== 'product') {
//           totalBeforeAllOffers += itemBasePrice;
//         }

//         // Apply item-specific offers (only 'money' and 'product' types initially)
//         if (offer) {
//           switch (offer.type) {
//             case 'product':
//               isFree = true;
//               itemBasePrice = 0; // Free item contributes 0 to its own total
//               freeProducts.push({
//                 ...product,
//                 quantity: order.quantity,
//                 offerTitle: offer.title
//               });
//               break;

//             case 'money':
//               itemDiscount = Math.min(offer.fixed || 0, itemBasePrice); // Discount cannot exceed item's base price
//               totalDiscountFromMoneyOffers += itemDiscount; // Accumulate money discounts
//               break;

//             case 'percentage':
//               // We'll handle percentage discounts on the total, but we need to know if one exists
//               //@ts-ignore
//               if (offer.percentage !== undefined && percentageOfferApplied === null) {
//                 percentageOfferApplied = offer.percentage;
//               }
//               // Do NOT apply percentage discount here on item-level
//               break;
//           }
//         }

//         return {
//           ...order,
//           product,
//           offer,
//           itemBasePrice: Math.round(itemBasePrice * 100) / 100, // Keep base price for display if needed
//           itemDiscount: Math.round(itemDiscount * 100) / 100,
//           isFree,
//           // itemTotal here is the price *after* item-specific money discounts, but before global percentage
//           itemTotal: Math.round((itemBasePrice - itemDiscount) * 100) / 100,
//         };
//       });

//       // Calculate subtotal after item-level money discounts
//       let subtotalAfterItemMoneyDiscounts = totalBeforeAllOffers - totalDiscountFromMoneyOffers;

//       // Apply percentage discount on the total subtotal if a percentage offer was found
//       let totalPercentageDiscount = 0;
//       if (percentageOfferApplied !== null) {
//         totalPercentageDiscount = (subtotalAfterItemMoneyDiscounts * percentageOfferApplied) / 100;
//         subtotalAfterItemMoneyDiscounts -= totalPercentageDiscount; // Apply this discount
//       }
      
//       let subtotalAfterAllOffers = subtotalAfterItemMoneyDiscounts; // RENAMED: This is the subtotal after all offers

//       // Calculate coin discount if coins were used
//       let coinDiscount = 0;
//       if (orderGroup.coinsUsed > 0) {
//         const coinValue = orderGroup.shop.coinValue; // Value of 100 coins
//         const singleCoinValue = coinValue / 100;
//         coinDiscount = orderGroup.coinsUsed * singleCoinValue;
//       }

//       // Final Total calculation with rounding up if decimal (e.g., 22.2 becomes 23)
//       const finalTotal = Math.ceil(subtotalAfterAllOffers - coinDiscount);

//       // Calculate coins to be credited (0.1 coins per rupee, minimum 1 coin)
//       const coinsToCredit = Math.floor(finalTotal * 0.1);

//       return {
//         id: orderGroup.id,
//         userId: orderGroup.userId,
//         shopId: orderGroup.shopId,
//         status: orderGroup.status,
//         createdAt: orderGroup.createdAt,
//         updatedAt: orderGroup.updatedAt,
//         soldOffline: orderGroup.soldOffline,
//         consumer: orderGroup.user,
//         shop: orderGroup.shop,
//         orders: processedOrders, // All original order items including free ones, with `isFree` flag
//         //@ts-ignore
//         freeProducts, // Only the items given free by product offers
//         totalBeforeAllOffers: Math.round(totalBeforeAllOffers * 100) / 100, // NEW FIELD
//         subtotalAfterOffers: Math.round(subtotalAfterAllOffers * 100) / 100, // RENAMED
//         totalDiscount: Math.round((totalDiscountFromMoneyOffers + totalPercentageDiscount) * 100) / 100,
//         coinsUsed: orderGroup.coinsUsed,
//         coinDiscount: Math.round(coinDiscount * 100) / 100,
//         finalTotal, // This is already rounded up if decimal
//         coinsToCredit: coinsToCredit >= 1 ? coinsToCredit : 0
//       };
//     });

//     return res.status(200).json({ message: transformedOrderGroups });
//   } catch (e) {
//     console.error(e + " error occurred");
//     return res.status(502).json({ message: "error while db call" });
//   }
// });

// shopRouter.post("/orders/update-status", async (req, res): Promise<any> => {
//   const { orderId, status } = req.body;
//   console.log("updating order status");

//   try {
//     const orderGroup = await prisma.orderGroup.findUnique({
//       where: { id: parseInt(orderId) },
//       include: {
//         orders: {
//           include: {
//             product: true,
//             offer: true
//           }
//         },
//         shop: {
//           select: {
//             coinValue: true
//           }
//         }
//       }
//     });

//     if (!orderGroup) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Update order status
//     await prisma.orderGroup.update({
//       where: { id: parseInt(orderId) },
//       data: { status }
//     });

//     if (status === 'CONFIRMED') {
//       // Update inventory for all products in the order
//       // This correctly decrements quantity for all items, including free ones,
//       // as long as they are present in orderGroup.orders
//       for (const order of orderGroup.orders) {
//         await prisma.product.update({
//           where: { id: order.productId },
//           data: {
//             quantity: {
//               decrement: order.quantity
//             }
//           }
//         });
//       }

//       // Recalculate totals for coin crediting (mirroring the /orders endpoint logic)
//       let totalBeforeAllOffersForCredit = 0;
//       let totalDiscountFromMoneyOffersForCredit = 0;
//       //@ts-ignore
//       let percentageOfferAppliedForCredit = null;

//       orderGroup.orders.forEach(order => {
//         const offer = order.offer;
//         let itemBasePrice = order.unitPrice * order.quantity;

//         if (offer?.type !== 'product') {
//           totalBeforeAllOffersForCredit += itemBasePrice;
//         }

//         if (offer) {
//           switch (offer.type) {
//             case 'money':
//               totalDiscountFromMoneyOffersForCredit += Math.min(offer.fixed || 0, itemBasePrice);
//               break;
//             case 'percentage':
//               //@ts-ignore
//               if (offer.percentage !== undefined && percentageOfferAppliedForCredit === null) {
//                 percentageOfferAppliedForCredit = offer.percentage;
//               }
//               break;
//           }
//         }
//       });

//       let subtotalAfterItemMoneyDiscountsForCredit = totalBeforeAllOffersForCredit - totalDiscountFromMoneyOffersForCredit;

//       let totalPercentageDiscountForCredit = 0;
//       if (percentageOfferAppliedForCredit !== null) {
//         totalPercentageDiscountForCredit = (subtotalAfterItemMoneyDiscountsForCredit * percentageOfferAppliedForCredit) / 100;
//         subtotalAfterItemMoneyDiscountsForCredit -= totalPercentageDiscountForCredit;
//       }
      
//       let finalSubtotalForCredit = subtotalAfterItemMoneyDiscountsForCredit;

//       let coinDiscount = 0;
//       if (orderGroup.coinsUsed > 0) {
//         const coinValue = orderGroup.shop.coinValue;
//         const singleCoinValue = coinValue / 100;
//         coinDiscount = orderGroup.coinsUsed * singleCoinValue;
//       }

//       // Apply Math.ceil here for consistency with the /orders calculation
//       const finalTotalForCredit = Math.ceil(finalSubtotalForCredit - coinDiscount);
//       const coinsToCredit = Math.floor(finalTotalForCredit * 0.1);

//       if (coinsToCredit >= 1) {
//         await prisma.user.update({
//           //@ts-ignore
//           where: { id: orderGroup.userId },
//           data: {
//             coinsAvailable: {
//               increment: coinsToCredit
//             }
//           }
//         });

//         await prisma.shopToUserCoin.create({
//           data: {
//             shopId: orderGroup.shopId,
//             //@ts-ignore
//             userId: orderGroup.userId,
//             volume: coinsToCredit
//           }
//         });
//       }
//     } else if (status === 'CANCELLED' && orderGroup.coinsUsed > 0) {
//       // Refund coins if order is cancelled and coins were used
//       await prisma.user.update({
//         //@ts-ignore
//         where: { id: orderGroup.userId },
//         data: {
//           coinsAvailable: {
//             increment: orderGroup.coinsUsed
//           }
//         }
//       });

//       await prisma.shopToUserCoin.create({
//         data: {
//           shopId: orderGroup.shopId,
//           //@ts-ignore
//           userId: orderGroup.userId,
//           volume: orderGroup.coinsUsed
//         }
//       });
//     }

//     return res.status(200).json({ message: "Order status updated successfully" });
//   } catch (e) {
//     console.error(e + " error occurred");
//     return res.status(502).json({ message: "error while updating order status" });
//   }
// });

shopRouter.post("/orders", async (req, res): Promise<any> => {
  const { shopId } = req.body;

  try {
    // Get order groups with their associated orders
    const orderGroups = await prisma.orderGroup.findMany({
      where: {
        shopId: parseInt(shopId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            localArea: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true,
            tagline: true,
            coinValue: true,
            localArea: true
          }
        },
        orders: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
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
                product: true // Include the product field from offer
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform order groups to include calculated totals and offer applications
    const transformedOrderGroups = orderGroups.map(orderGroup => {
      let totalBeforeAllOffers = 0;
      let totalDiscountFromMoneyOffers = 0;
      let totalDiscountFromProductOffers = 0;
      //@ts-ignore
      let percentageOfferApplied = null;
      let freeProductsFromOffers = []; // Store free products from offers

      const processedOrders = orderGroup.orders.map(order => {
        const product = order.product;
        const offer = order.offer;
        let itemBasePrice = order.unitPrice * order.quantity;
        let itemDiscount = 0;

        // Always add to totalBeforeAllOffers
        totalBeforeAllOffers += itemBasePrice;

        // Apply item-specific offers
        if (offer) {
          switch (offer.type) {
            case 'product':
              // For product offers, don't make the ordered item free
              // Instead, we'll add a separate free product later
              // The ordered item remains at full price
              break;

            case 'money':
              itemDiscount = Math.min(offer.fixed || 0, itemBasePrice);
              totalDiscountFromMoneyOffers += itemDiscount;
              break;

            case 'percentage':
              //@ts-ignore
              if (offer.percentage !== undefined && percentageOfferApplied === null) {
                percentageOfferApplied = offer.percentage;
              }
              break;
          }
        }

        return {
          ...order,
          product,
          offer,
          itemBasePrice: Math.round(itemBasePrice * 100) / 100,
          itemDiscount: Math.round(itemDiscount * 100) / 100,
          isFree: false, // Regular ordered items are never free
          itemTotal: Math.round((itemBasePrice - itemDiscount) * 100) / 100,
        };
      });

      // Now handle product offers by creating separate free products
      const productOffersMap = new Map(); // Track free products to avoid duplicates

      orderGroup.orders.forEach(order => {
        if (order.offer && order.offer.type === 'product' && order.offer.product) {
          const freeProductId = order.offer.product;
          
          // Only add one free product per offer type, regardless of how many orders have this offer
          if (!productOffersMap.has(freeProductId)) {
            // Get product details for the free product
            // We need to fetch this product's details
            productOffersMap.set(freeProductId, {
              productId: freeProductId,
              offerId: order.offer.id,
              offerTitle: order.offer.title,
              quantity: 1 // Always 1 free item
            });
          }
        }
      });

      // Convert productOffersMap to freeProducts array
      // Note: We'll need to fetch product details for free products
      const freeProducts = Array.from(productOffersMap.values());

      // Calculate subtotal after item-level discounts
      let subtotalAfterItemDiscounts = totalBeforeAllOffers - totalDiscountFromMoneyOffers - totalDiscountFromProductOffers;

      // Apply percentage discount if exists
      let totalPercentageDiscount = 0;
      if (percentageOfferApplied !== null) {
        totalPercentageDiscount = (subtotalAfterItemDiscounts * percentageOfferApplied) / 100;
        subtotalAfterItemDiscounts -= totalPercentageDiscount;
      }
      
      let subtotalAfterAllOffers = subtotalAfterItemDiscounts;

      // Calculate coin discount
      let coinDiscount = 0;
      if (orderGroup.coinsUsed > 0) {
        const coinValue = orderGroup.shop.coinValue;
        const singleCoinValue = coinValue / 100;
        coinDiscount = orderGroup.coinsUsed * singleCoinValue;
      }

      // Final Total calculation
      const finalTotal = Math.ceil(subtotalAfterAllOffers - coinDiscount);

      // Calculate coins to be credited
      const coinsToCredit = Math.floor(finalTotal * 0.1);

      return {
        id: orderGroup.id,
        userId: orderGroup.userId,
        shopId: orderGroup.shopId,
        status: orderGroup.status,
        createdAt: orderGroup.createdAt,
        updatedAt: orderGroup.updatedAt,
        soldOffline: orderGroup.soldOffline,
        consumer: orderGroup.user,
        shop: orderGroup.shop,
        orders: processedOrders,
        freeProducts, // Products that are free due to offers
        totalBeforeAllOffers: Math.round(totalBeforeAllOffers * 100) / 100,
        subtotalAfterOffers: Math.round(subtotalAfterAllOffers * 100) / 100,
        totalDiscount: Math.round((totalDiscountFromMoneyOffers + totalDiscountFromProductOffers + totalPercentageDiscount) * 100) / 100,
        coinsUsed: orderGroup.coinsUsed,
        coinDiscount: Math.round(coinDiscount * 100) / 100,
        finalTotal,
        coinsToCredit: coinsToCredit >= 1 ? coinsToCredit : 0
      };
    });

    // Now we need to fetch product details for free products
    for (let orderGroup of transformedOrderGroups) {
      if (orderGroup.freeProducts.length > 0) {
        const freeProductIds = orderGroup.freeProducts.map(fp => fp.productId);
        const products = await prisma.product.findMany({
          where: {
            id: { in: freeProductIds }
          },
          select: {
            id: true,
            name: true,
            price: true,
            image: true
          }
        });

        // Enrich free products with product details
        orderGroup.freeProducts = orderGroup.freeProducts.map(fp => {
          const productDetails = products.find(p => p.id === fp.productId);
          return {
            id: fp.productId,
            name: productDetails?.name || 'Unknown Product',
            image: productDetails?.image,
            quantity: fp.quantity,
            unitPrice: productDetails?.price || 0,
            offerTitle: fp.offerTitle || 'Free Item',
            isFree: true
          };
        });
      }
    }

    return res.status(200).json({ message: transformedOrderGroups });
  } catch (e) {
    console.error(e + " error occurred");
    return res.status(502).json({ message: "error while db call" });
  }
});
shopRouter.post("/orders/update-status", async (req, res): Promise<any> => {
  const { orderId, status } = req.body;
  
  try {
    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      if (status === "CONFIRMED") {
        // Get order details first
        const orderGroup = await tx.orderGroup.findUnique({
          where: { id: parseInt(orderId) },
          include: {
            orders: {
              include: {
                product: true,
                offer: {
                  select: {
                    id: true,
                    type: true,
                    product: true, // Include product field from offer
                    coinValue: true // Include coinValue for product offers
                  }
                }
              }
            },
            shop: true, // Include shop details to get coinValue
            user: true  // Include user details
          }
        });

        if (!orderGroup) {
          throw new Error("Order not found");
        }

        console.log(`Processing order confirmation for Order ID: ${orderId}`);
        console.log(`Order belongs to user: ${orderGroup.userId}`);
        console.log(`OrderGroup data:`, {
          id: orderGroup.id,
          totalAmount: orderGroup.totalAmount,
             //@ts-ignore
          finalTotal: orderGroup.finalTotal,
          coinsUsed: orderGroup.coinsUsed
        });
        console.log(`Shop coin value: ${orderGroup.shop?.coinValue}`);

        // Track free products to avoid duplicate inventory deductions
        const freeProductsDeducted = new Set();

        // Update inventory for each order item
        for (const order of orderGroup.orders) {
          // Update inventory for the ordered product (normal order)
          await tx.product.update({
            where: { id: order.productId },
            data: {
              quantity: {
                decrement: order.quantity
              }
            }
          });

          // If this order has a product offer, deduct inventory for the free product too
          if (order.offer && order.offer.type === 'product' && order.offer.product) {
            const freeProductId = order.offer.product;
            
            // Only deduct once per free product, even if multiple orders have the same offer
            if (!freeProductsDeducted.has(freeProductId)) {
              await tx.product.update({
                where: { id: freeProductId },
                data: {
                  quantity: {
                    decrement: 1 // Always deduct 1 for free product
                  }
                }
              });
              freeProductsDeducted.add(freeProductId);
            }
          }
        }

        // **COIN CREDIT LOGIC**
        if (orderGroup.userId && orderGroup.totalAmount > 0) {
          const shop = orderGroup.shop;
          // Use totalAmount instead of finalTotal, or calculate it if needed
          let totalAmount = orderGroup.totalAmount || 0;
          
          // If finalTotal exists and is valid, use it instead
             //@ts-ignore
          if (orderGroup.finalTotal && orderGroup.finalTotal > 0) {
               //@ts-ignore
            totalAmount = orderGroup.finalTotal;
          }
          
          console.log(`Calculating coins for amount: ₹${totalAmount}`);
          
          // Calculate coins to credit: 1 coin for every 10 rupees (10 coins per 100 rupees)
          let coinsToCredit = Math.floor(totalAmount / 10);
          
          // Ensure minimum 1 coin if the order amount is at least equal to the shop's coinValue
          if (coinsToCredit === 0 && totalAmount >= shop.coinValue) {
            coinsToCredit = 1;
          }

          console.log(`Coins to credit: ${coinsToCredit}`);

          // Only credit coins if there are coins to credit
          if (coinsToCredit > 0) {
            // Get current user coin balance for logging
            const currentUser = await tx.user.findUnique({
              where: { id: orderGroup.userId },
              select: { coinsAvailable: true }
            });

            console.log(`User current coins: ${currentUser?.coinsAvailable || 0}`);

            // Update user's coin balance
            const updatedUser = await tx.user.update({
              where: { id: orderGroup.userId },
              data: {
                coinsAvailable: {
                  increment: coinsToCredit
                }
              },
              select: { coinsAvailable: true }
            });

            console.log(`User coins after update: ${updatedUser.coinsAvailable}`);

            // Create entry in ShopToUserCoin table to track the transaction
            const coinTransaction = await tx.shopToUserCoin.create({
              data: {
                shopId: orderGroup.shopId,
                userId: orderGroup.userId,
                volume: coinsToCredit
              }
            });

            console.log(`Created coin transaction with ID: ${coinTransaction.id}`);
            console.log(`Successfully credited ${coinsToCredit} coins to user ${orderGroup.userId} for order ${orderId}`);
          } else {
            console.log(`No coins credited - calculated coins: ${coinsToCredit}, amount: ${totalAmount}, shop coin value: ${shop.coinValue}`);
          }
        } else {
             //@ts-ignore
          console.log(`Coin credit skipped - userId: ${orderGroup.userId}, totalAmount: ${orderGroup.totalAmount}, finalTotal: ${orderGroup.finalTotal}`);
        }
      }

      // **CANCELLATION LOGIC**
      if (status === "CANCELLED") {
        // Get order details for cancellation
        const orderGroup = await tx.orderGroup.findUnique({
          where: { id: parseInt(orderId) },
          include: {
            orders: {
              include: {
                product: true,
                offer: {
                  select: {
                    id: true,
                    type: true,
                    product: true,
                    coinValue: true // Coins required for product offers
                  }
                }
              }
            },
            shop: true,
            user: true
          }
        });

        if (!orderGroup) {
          throw new Error("Order not found");
        }

        console.log(`Processing order cancellation for Order ID: ${orderId}`);
        console.log(`Order belongs to user: ${orderGroup.userId}`);

        let totalCoinsToRefund = 0;

        // 1. Refund coins used for product offers
        for (const order of orderGroup.orders) {
          if (order.offer && order.offer.type === 'product' && order.offer.coinValue) {
            const coinsUsedForOffer = order.offer.coinValue;
            totalCoinsToRefund += coinsUsedForOffer;
            console.log(`Refunding ${coinsUsedForOffer} coins for product offer ID: ${order.offer.id}`);
          }
        }

        // 2. Refund coins directly used for order payment
        if (orderGroup.coinsUsed > 0) {
          totalCoinsToRefund += orderGroup.coinsUsed;
          console.log(`Refunding ${orderGroup.coinsUsed} coins used for order payment`);
        }

        // Process coin refund if there are coins to refund
        if (totalCoinsToRefund > 0 && orderGroup.userId) {
          // Get current user coin balance for logging
          const currentUser = await tx.user.findUnique({
            where: { id: orderGroup.userId },
            select: { coinsAvailable: true }
          });

          console.log(`User current coins before refund: ${currentUser?.coinsAvailable || 0}`);

          // Update user's coin balance
          const updatedUser = await tx.user.update({
            where: { id: orderGroup.userId },
            data: {
              coinsAvailable: {
                increment: totalCoinsToRefund
              }
            },
            select: { coinsAvailable: true }
          });

          console.log(`User coins after refund: ${updatedUser.coinsAvailable}`);

          // Create entry in ShopToUserCoin table to track the refund transaction
          // Note: This represents shop giving coins back to user (refund)
          const refundTransaction = await tx.shopToUserCoin.create({
            data: {
              shopId: orderGroup.shopId,
              userId: orderGroup.userId,
              volume: totalCoinsToRefund
            }
          });

          console.log(`Created refund transaction with ID: ${refundTransaction.id}`);
          console.log(`Successfully refunded ${totalCoinsToRefund} coins to user ${orderGroup.userId} for cancelled order ${orderId}`);
        } else {
          console.log(`No coins to refund - totalCoinsToRefund: ${totalCoinsToRefund}, userId: ${orderGroup.userId}`);
        }

        // Restore inventory for cancelled orders
        const freeProductsRestored = new Set();
        
        for (const order of orderGroup.orders) {
          // Restore inventory for the ordered product
          await tx.product.update({
            where: { id: order.productId },
            data: {
              quantity: {
                increment: order.quantity
              }
            }
          });

          // If this order had a product offer, restore inventory for the free product too
          if (order.offer && order.offer.type === 'product' && order.offer.product) {
            const freeProductId = order.offer.product;
            
            // Only restore once per free product
            if (!freeProductsRestored.has(freeProductId)) {
              await tx.product.update({
                where: { id: freeProductId },
                data: {
                  quantity: {
                    increment: 1
                  }
                }
              });
              freeProductsRestored.add(freeProductId);
            }
          }
        }

        console.log(`Restored inventory for cancelled order ${orderId}`);
      }

      // Update order status
      const updatedOrderGroup = await tx.orderGroup.update({
        where: { id: parseInt(orderId) },
        data: { status }
      });

      return updatedOrderGroup;
    });

    return res.status(200).json({
      message: "Order status updated successfully",
      orderGroup: result
    });

  } catch (e) {
    console.error("Error updating order status:", e);
    
    // Check if it's a specific Prisma error
   //@ts-ignore
    if (e.code === 'P2025') {
      return res.status(404).json({ message: "Order not found" });
    }
    
    return res.status(502).json({ 
      message: "Error updating order status",
      //@ts-ignore
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});
//@ts-ignore

// shopRouter.post("/orders/update-status", async (req, res)  : Promise <any>=> {
//   const { orderId, status } = req.body;
//   console.log("updating order status");
  
//   try {
//     const orderGroup = await prisma.orderGroup.findUnique({
//       where: { id: parseInt(orderId) },
//       include: {
//         orders: {
//           include: {
//             product: true,
//             offer: true
//           }
//         },
//         shop: {
//           select: {
//             coinValue: true
//           }
//         }
//       }
//     });

//     if (!orderGroup) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Update order status
//     await prisma.orderGroup.update({
//       where: { id: parseInt(orderId) },
//       data: { status }
//     });

//     if (status === 'CONFIRMED') {
//       // Update inventory for all products in the order
//       for (const order of orderGroup.orders) {
//         await prisma.product.update({
//           where: { id: order.productId },
//           data: {
//             quantity: {
//               decrement: order.quantity
//             }
//           }
//         });
//       }

//       // Credit coins to user if applicable
//       let subtotal = 0;
//       orderGroup.orders.forEach(order => {
//         if (!order.offer || order.offer.type !== 'product') {
//           let itemTotal = order.unitPrice * order.quantity;
          
//           // Apply percentage or money discounts
//           if (order.offer) {
//             if (order.offer.type === 'percentage') {
//                     //@ts-ignore
       
//               itemTotal = itemTotal - (itemTotal * order.offer.percentage) / 100;
//             } else if (order.offer.type === 'money') {
//               itemTotal = itemTotal - (order.offer.fixed || 0);
//             }
//           }
//           subtotal += itemTotal;
//         }
//       });

//       // Deduct coin discount
//       let coinDiscount = 0;
//       if (orderGroup.coinsUsed > 0) {
//         const coinValue = orderGroup.shop.coinValue;
//         const singleCoinValue = coinValue / 100;
//         coinDiscount = orderGroup.coinsUsed * singleCoinValue;
//       }

//       const finalTotal = Math.round(subtotal - coinDiscount);
//       const coinsToCredit = Math.floor(finalTotal * 0.1);

//       if (coinsToCredit >= 1) {
//         // Credit coins to user
//         await prisma.user.update({
//                 //@ts-ignore
       
//           where: { id: orderGroup.userId },
//           data: {
//             coinsAvailable: {
//               increment: coinsToCredit
//             }
//           }
//         });

//         // Record the coin transaction
//         await prisma.shopToUserCoin.create({
//           data: {
//             shopId: orderGroup.shopId,
//                   //@ts-ignore
       
//             userId: orderGroup.userId,
//             volume: coinsToCredit
//           }
//         });
//       }
//     } else if (status === 'CANCELLED' && orderGroup.coinsUsed > 0) {
//       // Refund coins if order is cancelled and coins were used
//       await prisma.user.update({
//               //@ts-ignore
       
//         where: { id: orderGroup.userId },
//         data: {
//           coinsAvailable: {
//             increment: orderGroup.coinsUsed
//           }
//         }
//       });

//       // Record the coin refund transaction
//       await prisma.shopToUserCoin.create({
//         data: {
//           shopId: orderGroup.shopId,
//           //@ts-ignore
//           userId: orderGroup.userId,
//           volume: orderGroup.coinsUsed
//         }
//       });
//     }

//     return res.status(200).json({ message: "Order status updated successfully" });
//   } catch (e) {
//     console.error(e + " error occurred");
//     return res.status(502).json({ message: "error while updating order status" });
//   }
// });