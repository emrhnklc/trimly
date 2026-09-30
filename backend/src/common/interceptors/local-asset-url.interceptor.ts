import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

const localAssetPaths = ['/barbershops/images/', '/users/profile-images/'];

@Injectable()
export class LocalAssetUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestOrigin = `${request.protocol}://${request.get('host')}`;
    const publicOrigin = process.env.PUBLIC_API_URL?.trim() || requestOrigin;

    return next
      .handle()
      .pipe(
        map((value: unknown) => normalizeLocalAssetUrls(value, publicOrigin)),
      );
  }
}

export function normalizeLocalAssetUrls(
  value: unknown,
  publicOrigin: string,
): unknown {
  if (typeof value === 'string') {
    return normalizeLocalAssetUrl(value, publicOrigin);
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeLocalAssetUrls(item, publicOrigin));
  }
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeLocalAssetUrls(item, publicOrigin),
    ]),
  );
}

function normalizeLocalAssetUrl(value: string, publicOrigin: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  if (!localAssetPaths.some((path) => url.pathname.startsWith(path))) {
    return value;
  }
  if (!isLocalNetworkHost(url.hostname)) return value;

  return new URL(
    `${url.pathname}${url.search}${url.hash}`,
    publicOrigin,
  ).toString();
}

function isLocalNetworkHost(hostname: string) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return false;
  }

  return (
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
