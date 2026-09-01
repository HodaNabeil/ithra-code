# IthraCode Contact Feature Documentation

## 1. Overview

The **Contact Feature** allows visitors of the IthraCode platform to send messages to the platform administration through a secure contact form.

The feature is designed to:

* Receive messages from visitors.
* Protect the contact endpoint from spam and automated bots.
* Validate all user input securely.
* Store messages permanently in the database.
* Send an email notification to the administration when a new message is received.
* Provide a foundation for a future Admin Inbox.

The system must not rely only on email delivery. The database is the primary source of truth, while email is used as a notification mechanism.

---

# 2. Core Decision

## Database + Email Notification

When a user submits the contact form, the message should be:

1. Validated on the server.
2. Checked against security and anti-spam mechanisms.
3. Stored in the PostgreSQL database.
4. Followed by an email notification to the platform administration.

### Flow

```text
User
  ↓
Contact Form
  ↓
POST /api/contact
  ↓
Security & Validation
  ↓
Database
  ↓
Email Notification
  ↓
Admin
```

### Why not email only?

Email-only implementations have several limitations:

* Emails may fail to deliver.
* Messages may be moved to spam.
* Email providers may experience temporary failures.
* There is no structured history of messages inside the application.
* Building an Admin Inbox later becomes more difficult.
* Message status cannot easily be tracked.

Therefore:

> **The database is the source of truth. Email is a notification channel.**

---

# 3. Contact Form Fields

The initial Contact Form should include:

```text
Name
Email
Subject
Message
```

Additional internal security fields:

```text
Turnstile Token
Honeypot Field
```

Example request:

```json
{
  "name": "Hoda",
  "email": "example@email.com",
  "subject": "Course Question",
  "message": "I would like to ask about the course.",
  "turnstileToken": "temporary-cloudflare-token",
  "website": ""
}
```

The `turnstileToken` must not be stored in the database.

The `website` field is a hidden Honeypot field and must not be visible to normal users.

---

# 4. Security Strategy

The Contact API must use multiple security layers.

```text
┌──────────────────────┐
│ Contact Form         │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Honeypot             │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Cloudflare Turnstile │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ API Rate Limiting    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Server Validation    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Save Message         │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Email Notification   │
└──────────────────────┘
```

Security must never depend only on client-side validation.

Any user or bot can bypass the frontend and directly call:

```text
POST /api/contact
```

Therefore, all important validation and verification must happen on the server.

---

# 5. Input Validation

Validation should happen in two places:

## Client-side validation

Used for better user experience.

Examples:

* Required fields.
* Email format.
* Minimum and maximum lengths.
* Immediate validation feedback.

Client-side validation is not considered a security boundary.

## Server-side validation

This is mandatory.

Recommended validation rules:

| Field           | Validation                          |
| --------------- | ----------------------------------- |
| Name            | Minimum 2 characters, maximum 100   |
| Email           | Valid email, maximum 255 characters |
| Subject         | Minimum 3 characters, maximum 150   |
| Message         | Minimum 10 characters, maximum 5000 |
| Turnstile Token | Required                            |
| Honeypot        | Must be empty                       |

Recommended tool:

```text
Zod
```

Example conceptual schema:

```ts
name: string().min(2).max(100)
email: string().email().max(255)
subject: string().min(3).max(150)
message: string().min(10).max(5000)
turnstileToken: string().min(1)
website: string().optional()
```

---

# 6. Cloudflare Turnstile

Cloudflare Turnstile will be used as the primary bot protection mechanism.

## Purpose

Turnstile helps verify that the form submission is made by a legitimate user rather than an automated bot.

## Environment Variables

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

### Public Site Key

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

This key can be used in the frontend.

### Secret Key

```env
TURNSTILE_SECRET_KEY
```

This key must only be used on the server.

It must never be:

* Exposed to the browser.
* Included in client-side JavaScript.
* Committed to Git.
* Added to public environment variables.

## Verification Flow

```text
User
  ↓
Completes Contact Form
  ↓
Turnstile generates Token
  ↓
Token sent with Form Request
  ↓
Next.js API
  ↓
Server verifies Token with Cloudflare
  ↓
Valid? ── No → Reject Request
  │
 Yes
  ↓
Continue Processing
```

The presence of a token in the frontend does not mean the request is trusted.

The server must verify the token before accepting the contact message.

---

# 7. Honeypot Protection

A Honeypot field provides an additional low-cost protection layer against simple bots.

Example field:

```text
website
```

The field should be hidden from normal users.

Expected legitimate request:

```json
{
  "website": ""
}
```

A bot may automatically fill the field:

```json
{
  "website": "spam-link.com"
}
```

If the Honeypot field contains a value:

```text
Request is considered suspicious.
```

Recommended behavior:

```text
Do not create a database record.
Do not send an email.
Return a generic success response.
```

Returning a generic success response helps avoid giving automated attackers information about the detection mechanism.

Honeypot must not be the only security layer.

---

# 8. Rate Limiting

Rate limiting protects the Contact API against:

* Spam.
* Request flooding.
* Automated abuse.
* Excessive email notifications.
* Resource exhaustion.

The platform already uses Redis, so Redis should be used for distributed rate limiting.

## Initial Recommendation

```text
5 requests
per 15 minutes
per IP address
```

Example:

```text
Request 1 → Allowed
Request 2 → Allowed
Request 3 → Allowed
Request 4 → Allowed
Request 5 → Allowed
Request 6 → Blocked
```

Blocked requests should return:

```text
HTTP 429 Too Many Requests
```

The exact limit may be adjusted later based on real production traffic.

---

# 9. Processing Order

The recommended processing order for:

```text
POST /api/contact
```

is:

```text
1. Rate Limit
2. Parse Request
3. Server-side Validation
4. Honeypot Check
5. Verify Cloudflare Turnstile
6. Create Contact Message
7. Store in Database
8. Send Email Notification
9. Return Success Response
```

Detailed flow:

```text
POST /api/contact
        ↓
Rate Limiter
        ↓
Parse JSON
        ↓
Zod Validation
        ↓
Honeypot Check
        ↓
Turnstile Verification
        ↓
Create Contact Message
        ↓
Save PostgreSQL
        ↓
Email Notification
        ↓
200 / 201 Success
```

---

# 10. Database Design

A `ContactMessage` entity should be created.

Recommended fields:

```text
id
name
email
subject
message
status
createdAt
updatedAt
```

Possible status values:

```text
NEW
READ
REPLIED
ARCHIVED
```

Conceptual model:

```text
ContactMessage
├── id
├── name
├── email
├── subject
├── message
├── status
├── createdAt
└── updatedAt
```

The security fields below should not be stored:

```text
turnstileToken
honeypot value
```

---

# 11. Database as the Source of Truth

The message must first become part of the application's persistent data.

The email notification is secondary.

```text
Database
    =
Source of Truth

Email
    =
Notification Channel
```

This architecture allows the platform to later support:

* Admin Inbox.
* Search.
* Filtering.
* Message status.
* Assigning messages to administrators.
* Internal notes.
* Analytics.
* Audit history.

---

# 12. Email Notification

After a valid message is stored, the system should notify the administration by email.

Example:

```text
Subject:
New Contact Message — IthraCode

Name:
Hoda

Email:
example@email.com

Subject:
Course Question

Message:
I would like to ask about the course.
```

The email provider must be called from the server.

Incorrect architecture:

```text
Frontend
  ↓
Email Provider API Key ❌
```

Correct architecture:

```text
Frontend
  ↓
Next.js API
  ↓
Email Service
  ↓
Admin Email
```

All email provider secrets must remain server-side.

---

# 13. Failure Handling

## Database fails

The request should fail.

Reason:

The database is the source of truth.

The system must not report that the message was successfully received if it was not stored.

## Email notification fails

The contact message should remain stored in the database.

Recommended behavior:

```text
Message saved successfully
+
Email notification failed
```

The user can still receive a successful response because the message was received by the platform.

Email delivery failure should be:

* Logged.
* Monitored.
* Retried later if a background job system is added.

---

# 14. Recommended Architecture

The Contact Feature should follow the existing feature-based architecture.

```text
src/features/contact/
├── domain/
│   ├── entities/
│   │   └── contact-message.entity.ts
│   │
│   └── repositories/
│       └── contact-message.repository.interface.ts
│
├── application/
│   └── use-cases/
│       └── create-contact-message.use-case.ts
│
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-contact-message.repository.ts
│   │
│   ├── security/
│   │   └── cloudflare-turnstile.verifier.ts
│   │
│   ├── rate-limit/
│   │   └── redis-contact-rate-limiter.ts
│   │
│   └── notifications/
│       └── email-contact-notifier.ts
│
├── api/
│   ├── dto/
│   │   └── create-contact-message.dto.ts
│   │
│   └── controllers/
│       └── create-contact-message.controller.ts
│
└── components/
    ├── contact-form.tsx
    └── contact-turnstile.tsx
```

---

# 15. API Layer Responsibilities

The API route should remain thin.

Example:

```text
app/api/contact/route.ts
```

The route should:

1. Receive the HTTP request.
2. Extract request data.
3. Call the controller or use case.
4. Return the HTTP response.

The route should not contain:

* Prisma queries.
* Cloudflare verification logic.
* Email implementation.
* Business logic.
* Rate limiting implementation.

Recommended flow:

```text
API Route
    ↓
Controller
    ↓
CreateContactMessageUseCase
    ↓
────────────────────────
↓          ↓           ↓
Repository  Verifier    Notifier
```

---

# 16. Application Use Case

The main business use case is:

```text
CreateContactMessageUseCase
```

Its responsibilities:

1. Receive validated contact data.
2. Verify security requirements.
3. Create the domain entity.
4. Save the entity using the repository.
5. Trigger an email notification.
6. Return the result.

The use case should depend on interfaces rather than concrete infrastructure implementations where possible.

Example dependencies:

```text
IContactMessageRepository
ITurnstileVerifier
IRateLimiter
IEmailNotifier
```

This allows implementations to be replaced later without changing the business logic.

---

# 17. API Response Design

## Successful Submission

```json
{
  "success": true,
  "message": "Your message has been received successfully."
}
```

## Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information."
  }
}
```

## Security Verification Failed

```json
{
  "success": false,
  "error": {
    "code": "SECURITY_VERIFICATION_FAILED",
    "message": "Unable to verify your request."
  }
}
```

## Rate Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

# 18. Environment Variables

Required environment variables:

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Redis
REDIS_URL=

# Database
DATABASE_URL=

# Email Provider
EMAIL_API_KEY=
CONTACT_NOTIFICATION_EMAIL=
```

Rules:

```text
NEXT_PUBLIC_* → May be exposed to the browser.
Other secrets → Server only.
```

All secret values must be excluded from Git.

---

# 19. Initial Security Checklist

* [ ] Client-side validation implemented.
* [ ] Server-side Zod validation implemented.
* [ ] Maximum input lengths enforced.
* [ ] Cloudflare Turnstile added.
* [ ] Turnstile token verified on the server.
* [ ] Secret key is server-side only.
* [ ] Honeypot field added.
* [ ] Redis rate limiting added.
* [ ] Rate limit returns HTTP 429.
* [ ] Contact messages stored in PostgreSQL.
* [ ] Security tokens are not stored in the database.
* [ ] Email notification is sent from the server.
* [ ] Email API keys are not exposed to the client.
* [ ] Failed email notifications are logged.
* [ ] Sensitive environment variables are not committed to Git.

---

# 20. Final Architecture Decision

## Decision

IthraCode will implement the Contact Feature using:

```text
Next.js
+
Feature-Based Architecture
+
Zod Validation
+
Cloudflare Turnstile
+
Honeypot
+
Redis Rate Limiting
+
PostgreSQL
+
Email Notification
```

## Final Request Flow

```text
Visitor
   ↓
Contact Form
   ↓
Client Validation
   ↓
Cloudflare Turnstile
   ↓
POST /api/contact
   ↓
Redis Rate Limiting
   ↓
Server-side Zod Validation
   ↓
Honeypot Check
   ↓
Turnstile Server Verification
   ↓
Create ContactMessage
   ↓
PostgreSQL
   ↓
Email Notification
   ↓
Success Response
```

## Core Principle

> **Never trust the frontend.**

The frontend improves the user experience, but all security decisions must be enforced on the server.

## Data Principle

> **The database is the source of truth. Email is a notification channel.**

## Security Principle

> **Security is implemented in layers, not through a single mechanism.**

This approach provides a secure, scalable, and maintainable foundation for the IthraCode Contact Feature and supports future expansion into a full Admin Inbox system.
