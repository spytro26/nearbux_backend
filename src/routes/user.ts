
import express from 'express';
const app = express();
app.use(express.json());
import 'dotenv/config'
import { Jwt  } from 'jsonwebtoken';
import {prisma} from '../index';
import { z } from "zod";
import bcrypt from 'bcrypt';
import { Twilio } from 'twilio';
 export const userRouter =  express.Router();


userRouter.post("/signup", async (req , res) : Promise <any>  =>{
    const {name , username , password , phonenumber} = req.body;
    const user = z.object({
      name :z.string().min(3).max(100),
     username : z.string(),
      password : z.string().min(8).max(16).regex(/[A-Z]/).regex(/[\W_]/)
      
  });
const bul = user.safeParse(req.body);
if(!bul.success){
  return res.status(400).json({ error: bul.error.errors });
}
try{
 const hashedpass =   await bcrypt.hash(password , 3);
 prisma.user.create({
  data  : {
    name : name,
    username : username, 
    password : hashedpass, 
    phonenumber  
  
  }
 }
 )
    


  res.json({
      message : "you are succesfully signed up ",
  })
}
catch(e){
  res.json({
      message : "an error while hashing the password ",
  })
}

     
    
    



 });

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, PORT } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
  throw new Error('Twilio credentials are not set in environment variables.');
}

const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);



userRouter.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;

  
  try {
    const verification = await client.verify
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    res.status(200).json({ status: verification.status });
  } catch (error) {
    console.error('Twilio Error:', error); // <-- PRINT FULL ERROR
    //@ts-ignore
    res.status(500).json({ error: error.message || 'Failed to send OTP' }); // <-- SEND FULL MESSAGE
  }
});

 // Endpoint to verify OTP
 userRouter.post('/verify-otp', async (req, res) => {
   const { phoneNumber, code } = req.body;
   try {
     const verificationCheck = await client.verify
       .services(TWILIO_VERIFY_SERVICE_SID)
       .verificationChecks.create({ to: phoneNumber, code });
     if (verificationCheck.status === 'approved') {
       // Proceed to save user data to the database
       res.status(200).json({ message: 'Phone number verified successfully.' });
     } else {
       res.status(400).json({ error: 'Invalid OTP.' });
     }
   } catch (error) {
     res.status(500).json({ error: 'Failed to verify OTP' });
   }
 });
 

 

