import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import { userRouter } from './routes/user';


import { PrismaClient } from '@prisma/client'

export  const prisma = new PrismaClient()
const app = express ();
app.use(cors()) ;
app.use(express.json());

app.use("/user", userRouter);





const port = process.env.port;
console.log("service running on port " + port);

app.listen(3000);
