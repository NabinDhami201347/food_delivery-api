import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import {
  CreateCustomerInput,
  EditCustomerProfileInput,
  OrderInputs,
  UserLoginInput,
} from "../dto";
import {
  generateSalt,
  hashedPassword,
  generateSignature,
  generateOtp,
  onRequestOTP,
  validatePassword,
} from "../utility";
import { Customer, Food, Order } from "../models";

export const CustomerSignUp = async (req: Request, res: Response) => {
  const customerInputs = plainToInstance(CreateCustomerInput, req.body);
  const validationError = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { email, phone, password } = customerInputs;
  const salt = await generateSalt();
  const hashed = await hashedPassword(password, salt);

  const { otp, expiry } = generateOtp();

  const existingCustomer = await Customer.find({ email });

  if (existingCustomer.length > 0) {
    return res.status(400).json({ message: "Email already exist!" });
  }

  const result = await Customer.create({
    email,
    password: hashed,
    salt,
    phone,
    otp,
    otp_expiry: expiry,
    firstName: "",
    lastName: "",
    address: "",
    verified: false,
    lat: 0,
    lng: 0,
    orders: [],
  });

  if (result) {
    // send OTP to customer
    await onRequestOTP(otp, phone);

    //Generate the Signature
    const signature = await generateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified,
    });
    // Send the result
    return res
      .status(201)
      .json({ signature, verified: result.verified, email: result.email });
  }

  return res.status(400).json({ msg: "Error while creating user" });
};

export const CustomerLogin = async (req: Request, res: Response) => {
  const customerInputs = plainToInstance(UserLoginInput, req.body);

  const validationError = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { email, password } = customerInputs;
  const customer = await Customer.findOne({ email: email });
  if (customer) {
    const validation = await validatePassword(
      password,
      customer.password,
      customer.salt
    );

    if (validation) {
      const signature = await generateSignature({
        _id: customer._id,
        email: customer.email,
        verified: customer.verified,
      });

      return res.status(200).json({
        signature,
        email: customer.email,
        verified: customer.verified,
      });
    }
  }

  return res.json({ msg: "Error With Signup" });
};

export const CustomerVerify = async (req: Request, res: Response) => {
  const { otp } = req.body;
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;

        const updatedCustomerResponse = await profile.save();
        const signature = await generateSignature({
          _id: updatedCustomerResponse._id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });

        return res.status(200).json({
          signature,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
      }
    }
  }

  return res.status(400).json({ msg: "Unable to verify Customer" });
};

export const RequestOtp = async (req: Request, res: Response) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const { otp, expiry } = generateOtp();
      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      await onRequestOTP(otp, profile.phone);

      return res
        .status(200)
        .json({ message: "OTP sent to your registered Mobile Number!" });
    }
  }

  return res.status(400).json({ msg: "Error with Requesting OTP" });
};

export const GetCustomerProfile = async (req: Request, res: Response) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      return res.status(201).json(profile);
    }
  }
  return res.status(400).json({ msg: "Error while Fetching Profile" });
};

export const EditCustomerProfile = async (req: Request, res: Response) => {
  const customer = req.user;

  const customerInputs = plainToInstance(EditCustomerProfileInput, req.body);

  const validationError = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { firstName, lastName, address } = customerInputs;

  if (customer) {
    const profile = await Customer.findById(customer._id);

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

export const CreateOrder = async (req: Request, res: Response) => {
  // get current user
  // create an order id
  // get order items from request [{id, unit}]
  // calculate order amount
  // create order with item description
  // finally update orders to user account
  const customer = req.user;
  if (customer) {
    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const cart = <[OrderInputs]>req.body;

      let cartItems = Array();
      let netAmount = 0.0;
      const foods = await Food.find()
        .where("_id")
        .in(cart.map((item) => item._id))
        .exec();

      foods.map((food) => {
        cart.map(({ _id, unit }) => {
          if (food._id == _id) {
            netAmount += food.price * unit;
            cartItems.push({ food, unit });
          }
        });
      });

      if (cartItems) {
        const currentOrder = await Order.create({
          orderId: orderId,
          items: cartItems,
          totalAmount: netAmount,
          orderDate: new Date(),
          paidThrough: "COD",
          paymentReponse: "",
          orderStatus: "Waiting",
        });

        if (currentOrder) {
          profile.orders.push(currentOrder);
        }
        await profile.save();
        return res.status(200).json(currentOrder);
      }
    }
  }

  return res.status(400).json({ msg: "Error while Creating Order" });
};

export const GetOrders = async (req: Request, res: Response) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("orders");
    if (profile) {
      return res.status(200).json(profile.orders);
    }
  }
  return res.status(400).json({ msg: "Orders not found" });
};

export const GetOrderById = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");
    if (order) {
      return res.status(200).json(order);
    }
  }
  return res.status(400).json({ msg: "Order not found" });
};
