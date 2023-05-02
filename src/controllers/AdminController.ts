import { Request, Response } from "express";
import { CreateVandorInput } from "../dto";
import { Vandor } from "../models";
import { generateSalt, hashedPassword } from "../utility";

export const findVandor = async (id: string | undefined, email?: string) => {
  if (email) {
    return await Vandor.findOne({ email });
  } else {
    return await Vandor.findById(id);
  }
};

export const CreateVandor = async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    pincode,
    address,
    ownerName,
    password,
    foodType,
  } = <CreateVandorInput>req.body;

  const existing = await findVandor("", email);
  if (existing !== null) {
    return res.json({ message: "Vandor exists with this email" });
  }

  const salt = await generateSalt();
  const hashed = await hashedPassword(password, salt);

  const createVandor = await Vandor.create({
    name,
    email,
    address,
    phone,
    pincode,
    foodType,
    ownerName,
    salt,
    password: hashed,
    rating: 0,
    coverImages: [],
    serviceAvailable: false,
  });

  return res.json(createVandor);
};

export const GetVandors = async (req: Request, res: Response) => {
  const vandors = await Vandor.find();

  if (vandors !== null) {
    return res.json(vandors);
  }

  return res.json({ message: "Opps, No vandor avaliable" });
};

export const GetVandor = async (req: Request, res: Response) => {
  const vandorId = req.params.id;
  const vandor = await findVandor(vandorId);

  if (vandor !== null) {
    return res.json(vandor);
  }

  return res.json({ message: "Opps, No vandor with this id" });
};
