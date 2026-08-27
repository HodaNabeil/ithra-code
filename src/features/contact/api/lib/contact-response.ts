import { NextResponse } from 'next/server';

import {
  ContactError,
  isContactError,
} from '../../domain/errors/contact.errors';
import type { CreateContactMessageResult } from '../../application/use-cases/create-contact-message.use-case';

type ContactErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type ContactSuccessBody = {
  success: true;
  message: string;
};

export function contactSuccessResponse(
  result: CreateContactMessageResult,
  status = 201,
): NextResponse<ContactSuccessBody> {
  return NextResponse.json(
    {
      success: true,
      message: result.message,
    },
    { status },
  );
}

export function contactErrorResponse(error: ContactError): NextResponse<ContactErrorBody> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status },
  );
}

export function mapContactRouteError(error: unknown): NextResponse<ContactErrorBody> {
  if (isContactError(error)) {
    return contactErrorResponse(error);
  }

  console.error('[CONTACT_ROUTE_ERROR]', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'حدث خطأ داخلي. يرجى المحاولة لاحقاً.',
      },
    },
    { status: 500 },
  );
}
