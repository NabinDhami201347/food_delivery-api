import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request } from "express";

import { VandorPayload, AuthPayload } from "../dto";
import { JWT_SECRET } from "../config";

export const generateSalt = async () => {
  return await bcrypt.genSalt();
};

export const hashedPassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};

export const validatePassword = async (
  enteredPassword: string,
  savedPassword: string,
  salt: string
) => {
  return (await hashedPassword(enteredPassword, salt)) === savedPassword;
};

export const generateSignature = (payload: VandorPayload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const validateSignature = async (req: Request) => {
  const signature = req.get("Authorization");
  if (signature) {
    const payload = (await jwt.verify(
      signature.split(" ")[1],
      JWT_SECRET
    )) as AuthPayload;

    req.user = payload;
    return true;
  }
  return false;
};
