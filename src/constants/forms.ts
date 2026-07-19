/**
 * Form and input related constants
 */

// HTML Input types
export const INPUT_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  DATE: 'date',
  TIME: 'time',
  DATE_TIME_LOCAL: 'datetime-local',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  FILE: 'file',
  IMAGE: 'image',
  COLOR: 'color',
  RANGE: 'range',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
  MONTH: 'month',
  WEEK: 'week',
  HIDDEN: 'hidden',
  MULTI_SELECT: 'multi select',
} as const;
export type InputType = (typeof INPUT_TYPES)[keyof typeof INPUT_TYPES];

// Navigation directions
export const NAVIGATE = {
  NEXT: 'next',
  PREV: 'prev',
  FIRST: 'first',
  LAST: 'last',
} as const;
export type NavigateDirection = (typeof NAVIGATE)[keyof typeof NAVIGATE];

// Form states
export const FORM_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;
export type FormState = (typeof FORM_STATES)[keyof typeof FORM_STATES];

// Autocomplete values
export const AUTOCOMPLETE = {
  OFF: 'off',
  ON: 'on',
  NAME: 'name',
  EMAIL: 'email',
  USERNAME: 'username',
  NEW_PASSWORD: 'new-password',
  CURRENT_PASSWORD: 'current-password',
  TEL: 'tel',
  STREET_ADDRESS: 'street-address',
  POSTAL_CODE: 'postal-code',
  COUNTRY: 'country',
} as const;
export type AutocompleteValue =
  (typeof AUTOCOMPLETE)[keyof typeof AUTOCOMPLETE];
