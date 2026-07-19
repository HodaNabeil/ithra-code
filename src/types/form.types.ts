import { InputTypes } from '@/constants/enums';
/**
 * Form and UI-related types
 */

export interface IOption {
  label: string;
  value: string;
}

export interface IFormField {
  name: string;
  label?: string;
  type: InputTypes | string;

  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  options?: IOption;
  id?: string;
  defaultValue?: string;
  readOnly?: boolean;
  showPasswordRequirements?: boolean;
  alwaysShowPasswordRequirements?: boolean;
  passwordFieldToValidate?: string;
}

export interface IFormFieldsVariables {
  slug: string;
}
