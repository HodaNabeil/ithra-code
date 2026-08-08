declare global {
  interface Window {
    Pixel: new (options: PaymobPixelOptions) => unknown;
  }
}

export type PaymobPixelOptions = {
  publicKey: string;
  clientSecret: string;
  elementId: string;
  paymentMethods?: string[];
  disablePay?: boolean;
  showSaveCard?: boolean;
  forceSaveCard?: boolean;
  cardValidationChanged?: (isValid: boolean) => void;
  beforePaymentComplete?: (paymentMethod: string) => Promise<boolean>;
  afterPaymentComplete?: (response: unknown) => Promise<void>;
  onPaymentCancel?: () => Promise<void>;
  customStyle?: Record<string, unknown>;
};

export {};
