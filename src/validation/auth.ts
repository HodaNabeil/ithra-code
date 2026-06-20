/**
 * Authentication validation schemas using Zod
 */
import { z } from '@/lib/zod-openapi';

// Email validation
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح');

// Password requirements configuration - matching backend IsPasswordStrong
export const PASSWORD_REQUIREMENTS = [
  {
    message: 'Password must be at least 8 characters long',
    regex: /.{8,}/,
    test: (password: string) => password.length >= 8,
  },
  {
    message: 'Password must contain at least one lowercase letter',
    regex: /[a-z]/,
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    message: 'Password must contain at least one uppercase letter',
    regex: /[A-Z]/,
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    message: 'Password must contain at least one number',
    regex: /[0-9]/,
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    message: 'Password must contain at least one special character',
    regex: /[!@#$%^&*(),.?":{}|<>]/,
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
] as const;

// Password validation - matching backend IsPasswordStrong exactly
export const passwordSchema = z
  .string()
  .min(8, PASSWORD_REQUIREMENTS[0].message)
  .regex(PASSWORD_REQUIREMENTS[1].regex, PASSWORD_REQUIREMENTS[1].message)
  .regex(PASSWORD_REQUIREMENTS[2].regex, PASSWORD_REQUIREMENTS[2].message)
  .regex(PASSWORD_REQUIREMENTS[3].regex, PASSWORD_REQUIREMENTS[3].message)
  .regex(PASSWORD_REQUIREMENTS[4].regex, PASSWORD_REQUIREMENTS[4].message);

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
  redirectTo: z.string().optional(),
});

// Register schema
export const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: emailSchema,
  password: passwordSchema,
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Request password setup schema (for OAuth users requesting password setup link)
export const requestPasswordSetupSchema = z.object({
  email: emailSchema,
});

// Reset password schema (token comes from URL, not form input)
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(
    (data): data is { password: string; confirmPassword: string } =>
      data.password === data.confirmPassword,
    {
      message: 'كلمتا المرور غير متطابقتين',
      path: ['confirmPassword'],
    },
  );

// Set password schema (for OAuth users setting their first password)
// Similar to reset password but with token and email from URL
export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(
    (data): data is { password: string; confirmPassword: string } =>
      data.password === data.confirmPassword,
    {
      message: 'كلمتا المرور غير متطابقتين',
      path: ['confirmPassword'],
    },
  );

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine(
    (
      data,
    ): data is {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    } => data.newPassword === data.confirmNewPassword,
    {
      message: 'كلمتا المرور غير متطابقتين',
      path: ['confirmNewPassword'],
    },
  )
  .refine(
    (
      data,
    ): data is {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    } => data.currentPassword !== data.newPassword,
    {
      message: 'يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية',
      path: ['newPassword'],
    },
  );

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'رمز التحقق مطلوب'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RequestPasswordSetupInput = z.infer<
  typeof requestPasswordSetupSchema
>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
