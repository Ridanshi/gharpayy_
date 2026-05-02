import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`FlowOps API listening on ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
