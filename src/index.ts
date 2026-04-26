import dotenv from "dotenv";
dotenv.config();
import { app } from "./app";

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Atlas backend listening on :${port}`);
});
