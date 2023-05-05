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
import { Customer, Food, Offer, Order, Transaction } from "../models";

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

/* ------------------- Orders Section --------------------- */
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
      let vendorId;

      const foods = await Food.find()
        .where("_id")
        .in(cart.map((item) => item._id))
        .exec();

      foods.map((food) => {
        cart.map(({ _id, unit }) => {
          if (food._id == _id) {
            vendorId = food.vendorId;
            netAmount += food.price * unit;
            cartItems.push({ food, unit });
          }
        });
      });

      if (cartItems) {
        const currentOrder = await Order.create({
          orderId: orderId,
          vendorId: vendorId,
          items: cartItems,
          totalAmount: netAmount,
          orderDate: new Date(),
          paidThrough: "COD",
          paymentReponse: "",
          orderStatus: "Waiting",
          remarks: "",
          deliveryId: "",
          appliedOffer: false,
          offerId: null,
          readyTime: 45,
        });

        if (currentOrder) {
          profile.cart = [] as any;
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

/* ------------------- Cart Section --------------------- */
export const AddToCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    let cartItems = Array();
    const { _id, unit } = <OrderInputs>req.body;

    const food = await Food.findById(_id);
    if (food) {
      if (profile != null) {
        cartItems = profile.cart;

        if (cartItems.length > 0) {
          // check and update
          let existFoodItems = cartItems.filter(
            (item) => item.food._id.toString() === _id
          );
          if (existFoodItems.length > 0) {
            const index = cartItems.indexOf(existFoodItems[0]);

            if (unit > 0) {
              cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else {
            cartItems.push({ food, unit });
          }
        } else {
          cartItems.push({ food, unit });
        }

        if (cartItems) {
          profile.cart = cartItems as any;
          const cartResult = await profile.save();
          return res.status(200).json(cartResult.cart);
        }
      }
    }
  }

  return res.status(404).json({ msg: "Unable to add to cart!" });
};
export const GetCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      return res.status(200).json(profile.cart);
    }
  }
  return res.status(400).json({ message: "Cart is Empty!" });
};
export const DeleteCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id)
      .populate("cart.food")
      .exec();

    if (profile != null) {
      profile.cart = [] as any;
      const cartResult = await profile.save();

      return res.status(200).json(cartResult);
    }
  }
  return res.status(400).json({ message: "cart is Already Empty!" });
};

/* ------------------- Offer Section --------------------- */
export const VerifyOffer = async (req: Request, res: Response) => {
  const offerId = req.params.id;
  const customer = req.user;
  if (customer) {
    const appliedOffer = await Offer.findById(offerId);

    if (appliedOffer) {
      if (appliedOffer.isActive) {
        return res
          .status(200)
          .json({ message: "Offer is Valid", offer: appliedOffer });
      }
    }
  }
  return res.status(400).json({ msg: "Offer is Not Valid" });
};

/* ------------------- Payment Section --------------------- */
export const CreatePayment = async (req: Request, res: Response) => {
  const customer = req.user;
  const { amount, paymentMode, offerId } = req.body;
  let payableAmount = Number(amount);

  if (offerId) {
    const appliedOffer = await Offer.findById(offerId);

    if (appliedOffer?.isActive) {
      payableAmount = payableAmount - appliedOffer?.offerAmount;
    }
  }
  // perform payment gateway charge api

  // create record on transaction
  const transaction = await Transaction.create({
    customer: customer?._id,
    vendorId: "",
    orderId: "",
    orderValue: payableAmount,
    offerUsed: offerId || "NA",
    status: "OPEN",
    paymentMode: paymentMode,
    paymentResponse: "Payment is cash on Delivery",
  });
  return res.status(200).json(transaction);
};
