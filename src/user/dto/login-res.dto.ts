import { LoginStatus } from '../interface/login.interface';

export class LoginResponse {
  loginStatus: LoginStatus;
  kycAccessToken: string | null;
  accessToken: string | null;
  signature: string | null;
}
