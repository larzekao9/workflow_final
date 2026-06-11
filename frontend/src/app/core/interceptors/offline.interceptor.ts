import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, Observable, switchMap, tap, throwError } from 'rxjs';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NetworkStatusService } from '../services/network-status.service';

const CACHEABLE: { pattern: RegExp; store: 'activities' | 'tramites' | 'workflows' }[] = [
  { pattern: /\/api\/activities$/, store: 'activities' },
  { pattern: /\/api\/tramites$/,   store: 'tramites'   },
  { pattern: /\/api\/workflows$/,  store: 'workflows'  },
];

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const offline = inject(OfflineStorageService);
  const network = inject(NetworkStatusService);

  const match = CACHEABLE.find(c => c.pattern.test(req.url));

  return next(req).pipe(
    tap(event => {
      if (match && event instanceof HttpResponse && event.status === 200 && Array.isArray(event.body)) {
        offline.saveAll(match.store, event.body).catch(() => {});
      }
    }),
    catchError(err => {
      if (!network.online() && match) {
        return from(offline.getAll(match.store)).pipe(
          switchMap(cached => new Observable<HttpEvent<unknown>>(obs => {
            obs.next(new HttpResponse<unknown>({ status: 200, body: cached }));
            obs.complete();
          }))
        );
      }
      return throwError(() => err);
    })
  );
};
