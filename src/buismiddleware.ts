
import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken"; 
const JWT_SECRET = process.env.buis_secret || "";


export const userMiddleware = async (req: Request, res: Response, next: NextFunction) => {

if(!JWT_SECRET || JWT_SECRET.length<2){
    return res.status(400).json({message : "jwt secret not found"})
}

    
    const header = req.headers["authorization"];
    
    
    const decoded = jwt.verify(header as string, JWT_SECRET);

    
    if (decoded) {
        // @ts-ignore
        req.userId = decoded.id; 
        next(); 
    } else {

        res.status(401).json({ message: "Unauthorized User" });
    }
};