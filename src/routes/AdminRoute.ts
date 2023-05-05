import express from "express";
import {
  CreateVandor,
  GetTransactionById,
  GetTransactions,
  GetVandor,
  GetVandors,
} from "../controllers";

const router = express.Router();

router.post("/vandor", CreateVandor);
router.get("/vandors", GetVandors);
router.get("/vandor/:id", GetVandor);

router.get("/transactions", GetTransactions);
router.get("/transaction/:id", GetTransactionById);
export { router as AdminRoute };
