'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlertIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import useFormFields from '@/hooks/useFormFields';
import { contactAction } from '../actions/contact.actions';
import { useState } from 'react';
import { ContactInput, contactSchema } from '@/validation/contact';
import FormField from '@/components/shared/form-fields';
import { APP_ROUTES } from '@/constants/enums';

export default function ContactForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { getFormFields } = useFormFields({ slug: APP_ROUTES.CONTACT });

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactInput) => {
    try {
      setError('');
      setSuccess('');

      const result = await contactAction(data);

      if (result.success) {
        setSuccess(
          result.message || 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً',
        );
        form.reset();
      } else {
        setError(
          result.message || 'يرجى التحقق من البيانات والمحاولة مرة أخرى.',
        );
      }
    } catch {
      setError('يرجى المحاولة مرة أخرى لاحقاً');
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const isValid = form.formState.isValid;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          {getFormFields().map((field, index) => (
            <FormField
              key={index}
              {...field}
              name={field.name as keyof ContactInput}
              disabled={isSubmitting}
              control={form.control}
              errors={form.formState.errors}
              passwordFieldToValidate={
                field.passwordFieldToValidate as keyof ContactInput
              }
            />
          ))}
          {error && (
            <p className="text-destructive text-sm flex items-center gap-2">
              <TriangleAlertIcon className="size-4" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-success text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              {success}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            variant="default"
            className="w-full rounded-xl"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? <Spinner /> : 'إرسال'}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
