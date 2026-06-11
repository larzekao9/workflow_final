import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  readonly online = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online',  () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }
}
