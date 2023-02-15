import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ENV } from '../../app.config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CmsWatchAttributes,
  WatchCmsData,
  WatchesResponse,
} from './cms.interface';

export interface WatchesCmsCache {
  watches: Record<string, CmsWatchAttributes>;
}

@Injectable()
export class CmsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CmsService.name);

  // private watches: Record<string, CmsWatchAttributes> = {};
  private watchesCmsCache: WatchesCmsCache;

  private client: AxiosInstance;

  async onApplicationBootstrap() {
    this.client = axios.create({
      baseURL: ENV.CMS_URL,
    });
    this.logger.log('CmsService loop started');
    this.startCmsLoop();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async startCmsLoop() {
    try {
      const responseWatches = await this.get<WatchesResponse>(
        '/api/watches?populate=*&pagination[limit]=10000',
      );
      // this.watches = responseWatches.data.reduce((acc, value) => {
      //   return { ...acc, [value.attributes.pid]: value.attributes };
      // }, {});

      this.watchesCmsCache = responseWatches.data.reduce(
        (acc: WatchesCmsCache, value: WatchCmsData) => {
          acc.watches = {
            ...acc.watches,
            [value.attributes.pid]: value.attributes,
          };

          return acc;
        },
        { watches: {} },
      );

      // this.logger.log('CmsService fetch watches complete');
    } catch (error) {
      this.logger.error(
        `CmsService fetch watches error: ${JSON.stringify(error)}`,
      );
    }
  }

  getCmsWatches(): WatchesCmsCache {
    return this.watchesCmsCache;
  }

  getCmsWatch(pid: string): CmsWatchAttributes {
    if (!this.watchesCmsCache) {
      return {} as CmsWatchAttributes;
    }
    return this.watchesCmsCache.watches[pid];
  }

  private async get<T>(url: string): Promise<T> {
    const response = await this.client.get(url, {});
    return this.getValue<T>(response);
  }

  private getValue<T>(response: AxiosResponse<T>): T {
    if (response.status === 200) {
      return response.data;
    } else if (response.status) {
      throw new Error(response.statusText);
    } else {
      throw new Error('undefined error');
    }
  }
}
