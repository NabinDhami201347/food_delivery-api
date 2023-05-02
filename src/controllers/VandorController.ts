import { Request, Response } from "express";
import { EditVandorInput, VandorLoginInput } from "../dto";
import { findVandor } from "./AdminController";
import { generateSignature, validatePassword } from "../utility";

export const VandorLogin = async (req: Request, res: Response) => {
  const { email, password } = <VandorLoginInput>req.body;

  const existing = await findVandor("", email);
  if (existing !== null) {
    const validation = await validatePassword(
      password,
      existing.password,
      existing.salt
    );
    if (validation) {
      const signature = generateSignature({
        _id: existing._id,
        email: existing.email,
        name: existing.name,
        foodType: existing.foodType,
      });
      return res.json(signature);
    } else {
      return res.json({ message: "Opps, Invalid Credentials" });
    }
  }

  return res.json({ message: "Opps, Invalid Credentials" });
};

export const GetVandorProfile = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    const existing = await findVandor(user._id);
    return res.json(existing);
  }
  return res.json({ message: "Vandor not found" });
};

export const UpdateVandorProfile = async (req: Request, res: Response) => {
  const user = req.user;
  const { name, phone, address, foodType } = <EditVandorInput>req.body;
  if (user) {
    const existing = await findVandor(user._id);
    if (existing !== null) {
      existing.name = name;
      existing.phone = phone;
      existing.address = address;
      existing.foodType = foodType;

      const savedResult = await existing.save();
      return res.json(savedResult);
    }
  }
  return res.json({ message: "Vandor not found" });
};

export const UpdateVandorService = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    const existing = await findVandor(user._id);
    if (existing !== null) {
      existing.serviceAvailable = !existing.serviceAvailable;
      const savedResult = await existing.save();
      return res.json(savedResult);
    }
  }
  return res.json({ message: "Vandor not found" });
};
