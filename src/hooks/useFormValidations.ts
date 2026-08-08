import * as z from 'zod';
import type { IFormFieldsVariables } from '@/types/app';
import { contactSchema } from '@/validation/contact';
import { APP_ROUTES } from '@/constants/enums';

type ValidationSchema =
  | typeof contactSchema
  | z.ZodObject<Record<string, never>>;

const useFormValidations = (
  props: IFormFieldsVariables,
): {
  getValidationSchema: () => ValidationSchema;
} => {
  const { slug } = props;

  const getValidationSchema = () => {
    switch (slug) {
      case APP_ROUTES.CONTACT:
        return contactSchema;
      default:
        return z.object({});
    }
  };

  return { getValidationSchema };
};

export default useFormValidations;
