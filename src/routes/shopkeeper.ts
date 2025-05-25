
import express from 'express';
const app = express();
app.use(express.json());
import 'dotenv/config'
import jwt from "jsonwebtoken";

 import {prisma} from '../index';
import { boolean, promise, z } from "zod";

import bcrypt from 'bcrypt';
import { TypePredicateKind } from 'typescript';


 export const shopRouter =  express.Router();



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
        console.log(shopId);
       const token = jwt.sign({id : foundUser.id , ownerId : shopId?.id}, jwt_pass);
       res.status(200).json({ token }); 
})

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

shopRouter.post("/info", async (req,res) : Promise <any> =>{
  const {shopName, tagline,pin,localArea,coinValue,ownerId } = req.body; 

  try {
  const shop=  await prisma.shop.create({
      data : {
        name : shopName,
        tagline ,
        pin , 
        localArea,
        value : coinValue,
        ownerId,


      }
    });
    return res.status(200).json({message : "added succefully" , id :shop.id})
       

  }catch (e){

    console.log(e);
    res.status(400).json({message : "error while adding info"});
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

shopRouter.get("/promotions/:shopId", async (req, res) : Promise <any> => {
  const shopId = parseInt(req.params.shopId);

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
      return res.status(400).json({message : 0});
  
    }

  }catch(e){
    console.error(e);
    return res.status(404).json({error : "error occured while db call"});
  }
 
    
});

shopRouter.post("/orders", async (req , res) : Promise <any> =>{

  const {shopId} = req.body;

   try {
      const response = await prisma.order.findMany({
        where : {
          shopId : parseInt(shopId)
        } ,
        include : {
           
            consumer : {
              select : {
                id : true, 
                name : true, 
                username:true, 

              }
            },
            product : {
              select : {
                id : true, 
                name : true, 
                price : true, 
                image : true, 
                
              }
            }
        }

        
      });
      return res.status(200).json({message : response  });

   }catch(e){
    console.error(e + " error occurred");
    return  res.status(502).json({message : "error while db call"});
   }
  
});

shopRouter.put("/orders/update-status", async (req, res)  : Promise <any> => {
  const { orderId, status } = req.body;
  
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: status }
    });
    
    return res.status(200).json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Failed to update order status" });
  }
});


shopRouter.post('/analytics', async (req, res)  : Promise <any>  => {
  try {
    const { shopId } = req.body;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get top selling items with total quantities sold (only CONFIRMED and COMPLETED orders)
    const topSellingItems = await prisma.order.groupBy({
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
    const coinsGiven = await prisma.coin.findMany({
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
    const acceptedOrders = await prisma.order.aggregate({
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
    const dailyOrders = await prisma.order.groupBy({
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
    const ordersByDate: Record<string, number> = dailyOrders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order._count.id;
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