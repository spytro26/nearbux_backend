
import express from 'express';
const app = express();
app.use(express.json());
import 'dotenv/config'
import { Jwt  } from 'jsonwebtoken';
import { z } from "zod";
import bcrypt from 'bcrypt';
 export const userRouter =  express.Router();


 userRouter.post("/signup", async (req, res) =>{
    



 })
