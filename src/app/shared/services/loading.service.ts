import { computed, signal, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _loadingKeys = signal<Set<string>>(new Set());

  readonly isLoading = computed(() => this._loadingKeys().size > 0);

  isLoadingKey(key: string) {
    return computed(() => this._loadingKeys().has(key));
  }

  show(key = 'global'): void {
    this._loadingKeys.update((keys) => {
      const next = new Set(keys);
      next.add(key);
      return next;
    });
  }

  hide(key = 'global'): void {
    this._loadingKeys.update((keys) => {
      const next = new Set(keys);
      next.delete(key);
      return next;
    });
  }
}
