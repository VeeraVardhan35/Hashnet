// Augment Express Request to carry decoded JWT user payload
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}
