import { Request, Response } from "express";
import {
  CreateFoodInput,
  CreateOfferInputs,
  EditVandorInput,
  VandorLoginInput,
} from "../dto";
import { findVandor } from "./AdminController";
import { generateSignature, validatePassword } from "../utility";
import { Food, Offer, Order } from "../models";

/* ------------------- Vandors Section --------------------- */
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
      const signature = await generateSignature({
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
  const { lat, lng } = req.body;

  if (user) {
    const existing = await findVandor(user._id);
    if (existing !== null) {
      existing.serviceAvailable = !existing.serviceAvailable;
      if (lat && lng) {
        existing.lat = lat;
        existing.lng = lng;
      }
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

/* ------------------- Foods Section --------------------- */
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

/* ------------------- Orders Section --------------------- */
export const GetCurrentOrders = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    const orders = await Order.find({ vendorId: user._id }).populate(
      "items.food"
    );
    if (orders) {
      return res.status(200).json(orders);
    }
  }

  return res.json({ message: "Orders Not found" });
};
export const GetOrderDetails = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");
    if (order != null) {
      return res.status(200).json(order);
    }
  }
  return res.json({ message: "Order Not found" });
};
export const ProcessOrder = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { status, remarks, time } = req.body;
  if (orderId) {
    const order = await Order.findById(orderId).populate({
      path: "items.food",
    });
    if (order) {
      order.orderStatus = status;
      order.remarks = remarks;
      if (time) {
        order.readyTime = time;
      }

      const orderResult = await order.save();
      if (orderResult != null) {
        return res.status(200).json(orderResult);
      }
    }
  }
  return res.json({ message: "Unable to process order" });
};

/* ------------------- Offers Section --------------------- */
export const GetOffers = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    let currentOffer = Array();
    const offers = await Offer.find().populate("vandors");

    if (offers) {
      offers.map((item) => {
        if (item.vandors) {
          item.vandors.map((vandor) => {
            if (vandor._id.toString() === user._id) {
              currentOffer.push(item);
            }
          });
        }

        if (item.offerType === "GENERIC") {
          currentOffer.push(item);
        }
      });
    }
    return res.status(200).json(currentOffer);
  }

  return res.json({ message: "Offers Not available" });
};
export const AddOffer = async (req: Request, res: Response) => {
  const user = req.user;
  if (user) {
    const {
      title,
      description,
      offerType,
      offerAmount,
      pincode,
      promocode,
      promoType,
      startValidity,
      endValidity,
      bank,
      bins,
      minValue,
      isActive,
    } = <CreateOfferInputs>req.body;

    const vandor = await findVandor(user._id);
    if (vandor) {
      const offer = await Offer.create({
        title,
        description,
        offerType,
        offerAmount,
        pincode,
        promoType,
        promocode,
        bins,
        startValidity,
        endValidity,
        bank,
        isActive,
        minValue,
        vandors: [vandor],
      });
      return res.status(200).json(offer);
    }
  }
  return res.json({ message: "Unable to add Offer!" });
};
export const EditOffer = async (req: Request, res: Response) => {
  const user = req.user;
  const offerId = req.params.id;

  if (user) {
    const {
      title,
      description,
      offerType,
      offerAmount,
      pincode,
      promocode,
      promoType,
      startValidity,
      endValidity,
      bank,
      bins,
      minValue,
      isActive,
    } = <CreateOfferInputs>req.body;

    const currentOffer = await Offer.findById(offerId);

    if (currentOffer) {
      const vendor = await findVandor(user._id);

      if (vendor) {
        (currentOffer.title = title),
          (currentOffer.description = description),
          (currentOffer.offerType = offerType),
          (currentOffer.offerAmount = offerAmount),
          (currentOffer.pincode = pincode),
          (currentOffer.promoType = promoType),
          (currentOffer.startValidity = startValidity),
          (currentOffer.endValidity = endValidity),
          (currentOffer.bank = bank),
          (currentOffer.isActive = isActive),
          (currentOffer.minValue = minValue);

        const result = await currentOffer.save();

        return res.status(200).json(result);
      }
    }
  }

  return res.json({ message: "Unable to add Offer!" });
};
