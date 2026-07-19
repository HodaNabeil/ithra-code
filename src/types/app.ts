import { InputTypes } from '@/constants/enums';

export interface IOption {
  label: string;
  value: string;
}
export interface IFormField {
  name: string;
  label?: string;
  type: InputTypes | 'file';
  required?: boolean;

  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  options?: IOption[];
  id?: string;
  description?: string;
  passwordFieldToValidate?: string;
}
export interface IFormFieldsVariables {
  slug: string;
  dynamicOptions?: Record<string, IOption[]>;
}
