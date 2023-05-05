import express from "express";
import multer from "multer";
import path from "path";

import {
  AddFood,
  AddOffer,
  EditOffer,
  GetCurrentOrders,
  GetFoods,
  GetOffers,
  GetOrderDetails,
  GetVandorProfile,
  ProcessOrder,
  UpdateVandorProfile,
  UpdateVandorService,
  UpdateVendorCoverImage,
  VandorLogin,
} from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../../images"));
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const images = multer({ storage: imageStorage }).array("images", 10);

/* ------------------- Vandors --------------------- */
router.post("/login", VandorLogin);

router.use(Authenticate);
router.get("/profile", GetVandorProfile);
router.patch("/profile", UpdateVandorProfile);
router.patch("/service", UpdateVandorService);
router.patch("/coverimage", images, UpdateVendorCoverImage);

/* ------------------- Foods --------------------- */
router.post("/food", images, AddFood);
router.get("/food", GetFoods);

/* ------------------- Orders --------------------- */
router.get("/orders", GetCurrentOrders);
router.put("/order/:id/process", ProcessOrder);
router.get("/order/:id", GetOrderDetails);

/* ------------------- Offers --------------------- */
router.post("/offer", AddOffer);
router.get("/offers", GetOffers);
router.put("/offer/:id", EditOffer);

export { router as VandorRoute };
