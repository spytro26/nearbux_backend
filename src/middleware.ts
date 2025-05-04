// Importing required types and modules from "express" and "jsonwebtoken".
import { NextFunction, Request, Response } from "express";
 // Importing the JWT secret key from a configuration file.
import jwt from "jsonwebtoken"; // Importing the jsonwebtoken library for token verification.
const JWT_SECRET = process.env.user_secret || "";

// Middleware to validate user authentication using a JWT token.
export const userMiddleware = async (req: Request, res: Response, next: NextFunction) => {

if(!JWT_SECRET || JWT_SECRET.length<2){
    return res.status(400).json({message : "jwt secret not found"})
}

    // Extract the "authorization" header from the request.
    const header = req.headers["authorization"];
    
    // Verify the JWT token using the secret key.
    const decoded = jwt.verify(header as string, JWT_SECRET);

    // If the token is successfully decoded, attach the user ID to the request object.
    if (decoded) {
        // @ts-ignore
        req.userId = decoded.id; // Store the decoded user ID for later use in request handling.
        next(); // Call the next middleware or route handler.
    } else {
        // If the token is invalid, send a 401 Unauthorized response.
        res.status(401).json({ message: "Unauthorized User" });
    }
};