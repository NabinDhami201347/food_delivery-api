import express from "express";
import path from "path";
import mongoose from "mongoose";

import { AdminRoute, VandorRoute } from "./routes";
import { MONGO_URI } from "./config";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/admin", AdminRoute);
app.use("/vandor", VandorRoute);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

app.listen(8000, () => {
  console.clear();
  console.log("http://localhost:8000");
});
