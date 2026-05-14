import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { registerPrismaShutdownHooks } from "./db/prisma";

const app = createApp();

registerPrismaShutdownHooks();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
