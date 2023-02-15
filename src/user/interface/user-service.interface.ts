export interface ConfirmationEmailCacheData {
  email: string;
  confirmationCode: number;
  timestamp: number;
}

export interface AddEmailReq {
  address: string;
  email: string;
}

export interface AddEmailRes {
  success: boolean;
}

export interface ConfirmEmailReq {
  address: string;
  confirmationCode: number;
}

export interface ConfirmEmailRes {
  success: boolean;
}
