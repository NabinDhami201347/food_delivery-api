# Conventions and Structure

## Models

```ts
import mongoose, { Document, Schema } from "mongoose";

interface VandorDoc extends Document {
  name: string;
  ownerName: string;
  foodType: [string];
  pincode: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  salt: string;
  serviceAvailable: boolean;
  coverImages: [string];
  rating: number;
  //   foods: any;
}

const VandorSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    foodType: { type: [String] },
    pincode: { type: String, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    serviceAvailable: { type: Boolean },
    coverImages: { type: [String] },
    rating: { type: Number },
    // foods: [
    //   {
    //     type: mongoose.SchemaTypes.ObjectId,
    //     ref: "food",
    //   },
    // ],
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.salt;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);

const Vandor = mongoose.model<VandorDoc>("vandor", VandorSchema);
export { Vandor };
```

## Data Transfer Objects and Utilies

```ts
export interface CreateVandorInput {
  name: string;
  ownerName: string;
  foodType: [string];
  pincode: string;
  address: string;
  phone: string;
  email: string;
  password: string;
}
```

```ts
import bcrypt from "bcrypt";

export const generateSalt = async () => {
  return await bcrypt.genSalt();
};

export const hashedPassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};
```

## Controller

```ts
import { Request, Response } from "express";
import { CreateVandorInput } from "../dto";
import { Vandor } from "../models";
import { generateSalt, hashedPassword } from "../utility";

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

  const existing = await Vandor.findOne({ email });
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
```

## Routing

```ts
import express from "express";
import { CreateVandor, GetVandor, GetVandors } from "../controllers";

const router = express.Router();

router.post("/vandor", CreateVandor);
router.get("/vandors", GetVandors);
router.get("/vandor/:id", GetVandor);

export { router as AdminRoute };
```
