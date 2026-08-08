export type ActionSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ActionFailure = {
  success: false;
  error: string;
};

export type ActionResponse<T> = ActionSuccess<T> | ActionFailure;

export type GuestCartSyncSummary = {
  synced: number;
  failed: number;
};
