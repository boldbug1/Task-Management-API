import jwt from 'jsonwebtoken'
import type { Request,Response,NextFunction } from 'express'

interface AuthenticatedRequest extends Request{
    user?:string|jwt.JwtPayload;
}
export const verifyToken = (req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
    const authHeader = req.headers['authorization'];

    const token  = authHeader && authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json("Token not found , Permission denied!");
    }

    try{
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not configured');
        }
        const verified = jwt.verify(token,secret);
        req.user = verified;
        next();
    }catch(error){
        return res.status(403).json('Invalid token');
    }
}