import { Request, NextFunction, Response } from "express";

import { AuthPayload } from "../dto";
import { validateSignature } from "../utility";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const Authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = await validateSignature(req);
  if (signature) {
    return next();
  } else {
    return res.json({ message: "User Not authorised" });
  }
};
