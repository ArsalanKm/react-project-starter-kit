import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from 'utils/Logger';

export interface SetupInterceptorArgs {
  on401Callback: () => void;
}
export interface CreateUrlArgs {
  url: string;
  queries?: Array<Query>;
  args?: Array<string>;
}
export interface Query {
  key: string;
  value: string | null;
}

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface SendChaparArgs<T = any, R = any, D = any> {
  method?: 'get' | 'post' | 'put';
  body?: T;
  setToken?: boolean;
  headers?: Record<string, any>;
  dto?: (payload: R) => D | null;
}
export interface SendChaparReturnType<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
}

export default class Api {
  private agent: AxiosInstance;
  private successStatusCode = [200, 201];

  constructor(baseUrl?: string) {
    this.agent = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000 * 5,
    });
  }

  setupInterceptors({ on401Callback }: SetupInterceptorArgs): void {
    this.agent.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        if (error?.response?.status === 401) {
          on401Callback?.();
        }

        return Promise.reject(error);
      },
    );
  }

  createUrl({ url, args = [], queries = [] }: CreateUrlArgs): string {
    let finalUrl = [url, ...args].join('/');

    queries.forEach((query, i) => {
      if (queries[i].value) {
        if (i === 0) {
          finalUrl += '?';
        }
        finalUrl += `${query.key}=${query.value}`;
        if (i !== queries.length - 1) {
          finalUrl += '&';
        }
      }
    });
    return finalUrl;
  }
  /**
   * @template T => Final Data (Result)
   * @template R => Chapar Response (Response)
   * @template B => Chapar Body (Body)
   */
  async sendRequest<T = any, R = any, B = Record<string, any>>(
    url: string,
    configs: SendChaparArgs<B, R, T> = { method: 'get', headers: {} },
  ): Promise<SendChaparReturnType<T>> {
    const { method, body, headers } = configs;
    let response: AxiosResponse<Response<R>>;
    try {
      const config: AxiosRequestConfig = { headers };

      switch (method) {
        case 'post':
        case 'put':
          response = await this.agent[method](url, body, config);
          break;
        case 'get':
        default:
          response = await this.agent.get(url, config);
          break;
      }
      const isSuccess = !!this.isSuccessStatus(response.status) || response.data.success;
      const finalData: R = response.data.data || (response.data as unknown as R);
      return {
        success: isSuccess,
        data: finalData as unknown as T,
        message: response.data.message,
      };
    } catch (err) {
      const error = err as AxiosError<Response<R>>;
      logger(err, {
        fileName: 'Request Error',
        description: JSON.stringify(error?.config),
      });
      return { success: false, data: null };
    }
  }

  private isSuccessStatus(statusCode: number) {
    return this.successStatusCode.includes(statusCode);
  }
}
