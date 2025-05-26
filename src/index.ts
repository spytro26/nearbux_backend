import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { userRouter } from './routes/user';
import { shopRouter } from './routes/shopkeeper';
import { PrismaClient } from '@prisma/client';
import router from './upload';

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", userRouter);
app.use("/shop", shopRouter);
app.use("/api", router);

app.get("/", (req, res) => {
  res.json({ active: "active" });
});

const port = process.env.port;
console.log("service running on port " + port);
app.listen(3000);

