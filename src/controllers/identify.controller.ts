import { Request, Response, NextFunction } from "express";
import { identityService } from "../services/identity.service";
import { IdentifyRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

export async function identifyController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as IdentifyRequest;

    // Sanitize: trim whitespace, lowercase emails
    const email = body.email?.trim().toLowerCase() || null;
    const phoneNumber = body.phoneNumber?.toString().trim() || null;

    if (!email && !phoneNumber) {
      throw new AppError(
        400,
        "At least one of email or phoneNumber must be provided"
      );
    }

    const result = await identityService.identify({ email, phoneNumber });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
