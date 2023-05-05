import express from "express";

import database from "./services/database";
import server from "./services/server";

const startServer = async () => {
  const app = express();
  await database();
  await server(app);

  app.listen(8000, () => {
    console.clear();
    console.log("http://localhost:8000");
  });
};

startServer();
