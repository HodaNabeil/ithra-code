import type {
  Control,
  FieldErrors,
  FieldValues,
  FieldPath,
} from 'react-hook-form';
import { FormInput, FormTextarea } from '@/components/ui/form';
import { IFormField } from '@/types/app';
import { INPUT_TYPES } from '@/constants/forms';
import ImageField from './image-field';

interface Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<IFormField, 'name' | 'passwordFieldToValidate'> {
  errors: FieldErrors;
  control: Control<TFieldValues>;
  className?: string;
  name: TName;
  passwordFieldToValidate?: FieldPath<TFieldValues>;
  currentImageUrl?: string; // Add prop for current image URL
  uploadProgress?: number; // Upload progress percentage
  isUploading?: boolean; // Upload state
}

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Props<TFieldValues, TName>,
) => {
  const { type } = props;

  const renderField = (): React.ReactNode => {
    if (type === INPUT_TYPES.IMAGE) {
      return (
        <ImageField
          {...props}
          currentImageUrl={props.currentImageUrl}
          uploadProgress={props.uploadProgress}
          isUploading={props.isUploading}
        />
      );
    }

    if (type === INPUT_TYPES.TEXTAREA) {
      return <FormTextarea {...props} />;
    }

    return <FormInput {...props} />;
  };

  return <>{renderField()}</>;
};
export default FormField;
