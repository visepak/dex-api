import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    if (req.headers && req.headers['X-Forwarded-For']) {
      return req.headers['X-Forwarded-For'];
    }

    if (req.ips?.length) {
      return req.ips[0];
    }

    return req.ip; // individualize IP extraction to meet your own needs
  }
}
