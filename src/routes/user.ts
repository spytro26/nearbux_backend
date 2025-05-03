
import express from 'express';
const app = express();
app.use(express.json());
import 'dotenv/config'
import { Jwt  } from 'jsonwebtoken';
 import {prisma} from '../index';
import { z } from "zod";

import bcrypt from 'bcrypt';

 export const userRouter =  express.Router();


userRouter.post("/signup", async (req , res) : Promise <any>  =>{
   console.log("request arrived");
    const {name , username , password , phoneNumber} = req.body;
    const user = z.object({
      name :z.string().min(3).max(100),
     username : z.string(),
      password : z.string().min(8).max(16).regex(/[A-Z]/).regex(/[\W_]/)

      
  });
const bul = user.safeParse(req.body);
if(!bul.success){
  return res.status(400).json({ error: bul.error.errors });
};
    console.log("before try");
try{
 const hashedpass =   await bcrypt.hash(password , 3);
  await prisma.user.create({
  data  : {
    name : name,
    username : username, 
    password : hashedpass, 
    phone : phoneNumber, 
  
  }
 }
 )
 console.log("user signed up")    ;
    


  res.json({
      message : "you are succesfully signed up ",
  })
}
catch(e){
  res.json({
      message : "an error while hashing the password ",
  })
}

     
    
    console.log(username ,  name , password , phoneNumber)  ; 
    console.log(typeof(username), typeof(name), typeof(password), typeof(phoneNumber));
    
   


 });

 userRouter.get("/signup", async (req, res)=>{
    console.log("request arrived");
    res.status(400).json({message : "hiihi"})
 });


 userRouter.post("/info", async (req, res) : Promise <any> => {
  const { phoneNumber, area, pinCode } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        phone: phoneNumber,
      },
    });

    if (!existingUser) {
      return res.status(400).json({ message: "User not found with this phone number." });
    }

    const updatedUser = await prisma.user.update({
      where: {
        phone: phoneNumber,
      },
      data: {
        local_area: area,
        pin: pinCode,
      },
    });

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Something went wrong", error });
  }
});
