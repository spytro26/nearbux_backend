
import express from 'express';
const app = express();
app.use(express.json());
import 'dotenv/config'
import jwt from "jsonwebtoken";

 import {prisma} from '../index';
import { boolean, promise, z } from "zod";

import bcrypt from 'bcrypt';


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

   if(userInput.length<9){
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

       }
       const token = jwt.sign({id : foundUser.id}, jwt_pass);
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










 

 