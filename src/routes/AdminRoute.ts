import express from "express";
import { CreateVandor, GetVandor, GetVandors } from "../controllers";

const router = express.Router();

router.post("/vandor", CreateVandor);
router.get("/vandors", GetVandors);
router.get("/vandor/:id", GetVandor);

export { router as AdminRoute };
