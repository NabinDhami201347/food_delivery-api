import express from "express";
import {
  AddToCart,
  CreateOrder,
  CustomerLogin,
  CustomerSignUp,
  CustomerVerify,
  DeleteCart,
  EditCustomerProfile,
  GetCart,
  GetCustomerProfile,
  GetOrderById,
  GetOrders,
  RequestOtp,
  VerifyOffer,
} from "../controllers/CustomerController";
import { Authenticate } from "../middlewares";

const router = express.Router();

/* ------------------- Customer --------------------- */
router.post("/signup", CustomerSignUp);
router.post("/login", CustomerLogin);

router.use(Authenticate);
router.patch("/verify", CustomerVerify);
router.get("/otp", RequestOtp);

/* ------------------- Profile --------------------- */
router.get("/profile", GetCustomerProfile);
router.patch("/profile", EditCustomerProfile);

/* ------------------- Orders --------------------- */
router.post("/create-order", CreateOrder);
router.get("/orders", GetOrders);
router.get("/order/:id", GetOrderById);

/* ------------------- Carts --------------------- */
router.post("/cart", AddToCart);
router.get("/cart", GetCart);
router.delete("/cart", DeleteCart);

/* ------------------- Apply Offers--------------------- */
router.get("/offer/verify/:id", VerifyOffer);

export { router as CustomerRoute };
