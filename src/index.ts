import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import { AdminRoute } from "./routes";
import { MONGO_URI } from "./config";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/admin", AdminRoute);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

app.listen(8000, () => {
  console.clear();
  console.log("http://localhost:8000");
});
