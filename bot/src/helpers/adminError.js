import { ValidationError } from "../priceService.js";

export function sendAdminError(res, err, context) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(context, err);
  return res.status(500).json({ error: "Server xatosi" });
}
