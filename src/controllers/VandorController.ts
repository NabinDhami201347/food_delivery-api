import { Request, Response } from "express";
import { CreateFoodInput, EditVandorInput, VandorLoginInput } from "../dto";
import { findVandor } from "./AdminController";
import { generateSignature, validatePassword } from "../utility";
import { Food } from "../models";

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

export const UpdateVendorCoverImage = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    const vendor = await findVandor(user._id);
    if (vendor !== null) {
      const files = req.files as [Express.Multer.File];
      const images = files.map((file: Express.Multer.File) => file.filename);
      vendor.coverImages.push(...images);
      const saveResult = await vendor.save();
      return res.json(saveResult);
    }
  }
  return res.json({ message: "Unable to Update vendor profile " });
};

export const AddFood = async (req: Request, res: Response) => {
  const user = req.user;
  const { name, description, category, foodType, readyTime, price } = <
    CreateFoodInput
  >req.body;

  if (user) {
    const vendor = await findVandor(user._id);
    if (vendor !== null) {
      const files = req.files as [Express.Multer.File];
      const images = files.map((file: Express.Multer.File) => file.filename);
      const food = await Food.create({
        vendorId: vendor._id,
        name: name,
        description: description,
        category: category,
        price: price,
        rating: 0,
        readyTime: readyTime,
        foodType: foodType,
        images: images,
      });

      vendor.foods.push(food);
      const result = await vendor.save();
      return res.json(result);
    }
  }
  return res.json({ message: "Unable to Update vendor profile " });
};

export const GetFoods = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    const foods = await Food.find({ vendorId: user._id });

    if (foods !== null) {
      return res.json(foods);
    }
  }
  return res.json({ message: "Foods not found!" });
};
