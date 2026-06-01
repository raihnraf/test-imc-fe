import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

export class DataTableState {
  private readonly destroyRef = inject(DestroyRef);

  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly statusFilter = signal<boolean | null>(null);
  readonly isLoading = signal(false);
  readonly searchQuery = signal('');

  private readonly searchSubject = new Subject<string>();

  readonly search$ = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef),
  );

  constructor() {
    this.search$.subscribe((query) => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
    });
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilter(isActive: boolean | null): void {
    this.statusFilter.set(isActive);
    this.currentPage.set(1);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  resetPage(): void {
    this.currentPage.set(1);
  }

  toListParams(extra?: Record<string, unknown>): Record<string, unknown> {
    const params: Record<string, unknown> = {
      page: this.currentPage(),
      perPage: this.pageSize(),
    };

    const query = this.searchQuery();
    if (query) {
      params['search'] = query;
    }

    const status = this.statusFilter();
    if (status !== null) {
      params['isActive'] = status;
    }

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params[key] = value;
        }
      });
    }

    return params;
  }
}
