import { getClientIp } from '@/lib/client-ip';
import { submitContactMessage } from '@/features/contact/infrastructure/di/contact.container';
import {
  contactSuccessResponse,
  mapContactRouteError,
} from '@/features/contact/api/lib/contact-response';

/**
 * POST /api/contact
 *
 * Public endpoint for contact form submissions.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const result = await submitContactMessage(body, { ip });

    return contactSuccessResponse(result, result.honeypot ? 200 : 201);
  } catch (error) {
    return mapContactRouteError(error);
  }
}
