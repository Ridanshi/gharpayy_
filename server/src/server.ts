import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

connectDb()
  .then(() => {
    app.listen(env.port, "0.0.0.0", () => {
      console.log(`FlowOps API listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start FlowOps API");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
