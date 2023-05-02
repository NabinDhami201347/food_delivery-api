import express from "express";

import {
  GetVandorProfile,
  UpdateVandorProfile,
  UpdateVandorService,
  VandorLogin,
} from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

router.post("/login", VandorLogin);

router.use(Authenticate);
router.get("/profile", GetVandorProfile);
router.patch("/profile", UpdateVandorProfile);
router.patch("/service", UpdateVandorService);

export { router as VandorRoute };
