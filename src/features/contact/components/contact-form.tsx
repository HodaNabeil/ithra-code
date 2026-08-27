'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, TriangleAlertIcon } from 'lucide-react';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';

import FormField from '@/components/shared/form-fields';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { APP_ROUTES } from '@/constants/enums';
import useFormFields from '@/hooks/useFormFields';
import { cn } from '@/lib/utils';
import { ContactInput, contactSchema } from '@/validation/contact';

import { contactAction } from '../actions/contact.actions';
import { isTurnstileEnabled } from '../lib/turnstile-config';
import ContactTurnstile from './contact-turnstile';

type ContactUserDefaults = {
  name: string;
  email: string;
};

type ContactFormProps = {
  userDefaults?: ContactUserDefaults;
};

const contactFieldClassName = cn(
  'rounded-[3px_9px_3px_6px]',
  'border',
  'border-gray-alpha-200',
  'dark:border-gray-alpha-300',
  'bg-grayscale-a2',
  'text-foreground',
  'shadow-none',
  'hover:border-gray-alpha-300',
  'dark:hover:border-gray-alpha-400',
  'focus-visible:rounded-[3px_9px_3px_6px]',
  'focus-visible:border-ring!',
);

const MESSAGES = {
  securityRequired: 'يرجى إكمال التحقق الأمني قبل الإرسال.',
  success: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً',
  validationFailed: 'يرجى التحقق من البيانات والمحاولة مرة أخرى.',
  genericError: 'يرجى المحاولة مرة أخرى لاحقاً',
} as const;

function subscribeNoop() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export default function ContactForm({ userDefaults }: ContactFormProps) {
  const turnstileEnabled = isTurnstileEnabled();
  const isClient = useIsClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const { getFormFields } = useFormFields({ slug: APP_ROUTES.CONTACT });

  const defaultValues = useMemo<ContactInput>(
    () => ({
      name: userDefaults?.name ?? '',
      email: userDefaults?.email ?? '',
      message: '',
      website: '',
      turnstileToken: '',
    }),
    [userDefaults?.email, userDefaults?.name],
  );

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues,
  });

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileResetKey((current) => current + 1);
  }, []);

  const onSubmit = useCallback(
    async (data: ContactInput) => {
      try {
        setError('');
        setSuccess('');

        if (turnstileEnabled && !turnstileToken) {
          setError(MESSAGES.securityRequired);
          return;
        }

        const result = await contactAction({
          ...data,
          turnstileToken: turnstileToken ?? undefined,
        });

        if (result.success) {
          setSuccess(result.message || MESSAGES.success);
          form.reset(defaultValues);
          resetTurnstile();
          return;
        }

        setError(result.message || MESSAGES.validationFailed);
      } catch {
        setError(MESSAGES.genericError);
      }
    },
    [
      defaultValues,
      form,
      resetTurnstile,
      turnstileEnabled,
      turnstileToken,
    ],
  );

  const { isSubmitting, errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldSet>
        <FieldGroup>
          {getFormFields().map((field) => (
            <FormField
              key={field.name}
              {...field}
              name={field.name as keyof ContactInput}
              className={contactFieldClassName}
              disabled={isSubmitting}
              control={form.control}
              errors={errors}
              passwordFieldToValidate={
                field.passwordFieldToValidate as keyof ContactInput
              }
            />
          ))}

          <div
            className="absolute -left-2499.75 h-0 w-0 overflow-hidden"
            aria-hidden
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register('website')}
            />
          </div>

          {turnstileEnabled ? (
            <div className="flex min-h-32.5 w-full items-center justify-center">
              {isClient ? (
                <ContactTurnstile
                  key={turnstileResetKey}
                  onTokenChange={setTurnstileToken}
                />
              ) : null}
            </div>
          ) : null}

          <div className="min-h-5">
            {error ? (
              <p
                role="alert"
                className="text-destructive flex items-center gap-2 text-sm"
              >
                <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}
            {success ? (
              <p
                role="status"
                className="text-success flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {success}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
          >
            {isSubmitting ? <Spinner /> : 'إرسال'}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
