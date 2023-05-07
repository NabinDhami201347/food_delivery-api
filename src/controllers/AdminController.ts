import { Request, Response } from "express";
import { CreateVandorInput } from "../dto";
import { Transaction, Vandor } from "../models";
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
    foods: [],
    lat: 0,
    lng: 0,
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

export const GetTransactions = async (req: Request, res: Response) => {
  const transactions = await Transaction.find();
  if (transactions) {
    return res.status(200).json(transactions);
  }
  return res.json({ message: "Transactions data not available" });
};

export const GetTransactionById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const transaction = await Transaction.findById(id);
  if (transaction) {
    return res.status(200).json(transaction);
  }
  return res.json({ message: "Transaction data not available" });
};
