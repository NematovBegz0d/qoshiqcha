// Tashqi bog'liqliksiz (firebase-admin'siz) xato turlari.
// Alohida modul — sof mantiqni (cartPricing) firebaseAdmin'siz testlash imkonini beradi.

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}
