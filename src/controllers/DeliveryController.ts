import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import {
  CreateDeliveryUserInput,
  EditCustomerProfileInput,
  UserLoginInput,
} from "../dto";
import { DeliveryUser } from "../models";

import {
  hashedPassword,
  generateSalt,
  generateSignature,
  validatePassword,
} from "../utility";

export const DeliverySignUp = async (req: Request, res: Response) => {
  const deliveryUserInputs = plainToInstance(CreateDeliveryUserInput, req.body);
  const validationError = await validate(deliveryUserInputs, {
    validationError: { target: true },
  });

  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { email, phone, password, address, firstName, lastName, pincode } =
    deliveryUserInputs;
  const salt = await generateSalt();
  const hashed = await hashedPassword(password, salt);
  const existingDeliveryUser = await DeliveryUser.findOne({ email });

  if (existingDeliveryUser !== null) {
    return res
      .status(400)
      .json({ message: "A Delivery User exist with the provided email ID!" });
  }

  const result = await DeliveryUser.create({
    email,
    password: hashed,
    salt,
    phone,
    firstName,
    lastName,
    address,
    pincode,
    verified: false,
    lat: 0,
    lng: 0,
  });

  if (result) {
    const signature = await generateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified,
    });
    return res
      .status(201)
      .json({ signature, verified: result.verified, email: result.email });
  }

  return res.status(400).json({ msg: "Error while creating Delivery user" });
};

export const DeliveryLogin = async (req: Request, res: Response) => {
  const loginInputs = plainToInstance(UserLoginInput, req.body);
  const validationError = await validate(loginInputs, {
    validationError: { target: true },
  });
  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { email, password } = loginInputs;
  const deliveryUser = await DeliveryUser.findOne({ email });
  if (deliveryUser) {
    const validation = await validatePassword(
      password,
      deliveryUser.password,
      deliveryUser.salt
    );

    if (validation) {
      const signature = await generateSignature({
        _id: deliveryUser._id,
        email: deliveryUser.email,
        verified: deliveryUser.verified,
      });

      return res.status(200).json({
        signature,
        email: deliveryUser.email,
        verified: deliveryUser.verified,
      });
    }
  }
  return res.json({ msg: "Error Login" });
};

export const GetDeliveryProfile = async (req: Request, res: Response) => {
  const deliveryUser = req.user;
  if (deliveryUser) {
    const profile = await DeliveryUser.findById(deliveryUser._id);
    if (profile) {
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: "Error while Fetching Profile" });
};

export const EditDeliveryProfile = async (req: Request, res: Response) => {
  const deliveryUser = req.user;
  const customerInputs = plainToInstance(EditCustomerProfileInput, req.body);
  const validationError = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { firstName, lastName, address } = customerInputs;
  if (deliveryUser) {
    const profile = await DeliveryUser.findById(deliveryUser._id);
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;
      const result = await profile.save();
      return res.status(201).json(result);
    }
  }
  return res.status(400).json({ msg: "Error while Updating Profile" });
};

/* ------------------- Delivery Notification --------------------- */
export const UpdateDeliveryUserStatus = async (req: Request, res: Response) => {
  const deliveryUser = req.user;
  if (deliveryUser) {
    const { lat, lng } = req.body;
    const profile = await DeliveryUser.findById(deliveryUser._id);

    if (profile) {
      if (lat && lng) {
        profile.lat = lat;
        profile.lng = lng;
      }

      profile.isAvailable = !profile.isAvailable;
      const result = await profile.save();
      return res.status(201).json(result);
    }
  }
  return res.status(400).json({ msg: "Error while Updating Profile" });
};
