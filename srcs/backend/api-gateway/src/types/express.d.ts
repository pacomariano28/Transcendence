declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, string>;
    }
  }
}

export {};
