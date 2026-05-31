import {
  Component,
  computed,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../../shared/services/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Page } from '../../../shared/models/page.model';

@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './page-list.component.html',
  styleUrls: ['./page-list.component.scss'],
})
export class PageListComponent implements OnInit, OnDestroy {
  private readonly pageService = inject(PageService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly items = signal<Page[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly isLoading = signal(false);
  readonly statusFilter = signal<boolean | null>(null);
  private searchQuery = signal('');

  readonly isTablet = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(
        map((result) => result.matches),
        startWith(false),
      ),
    { initialValue: false },
  );

  readonly desktopColumns = ['name', 'route_path', 'display_order', 'status', 'actions'];
  readonly tabletColumns = ['name', 'status', 'actions'];
  readonly displayedColumns = computed(() =>
    this.isTablet() ? this.tabletColumns : this.desktopColumns,
  );

  private searchSubject = new Subject<string>();
  private searchSub: Subscription;

  constructor() {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.currentPage.set(1);
        this.loadItems();
      });
  }

  ngOnInit(): void {
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
  }

  loadItems(): void {
    this.isLoading.set(true);

    this.pageService
      .list({
        page: this.currentPage(),
        perPage: this.pageSize(),
        search: this.searchQuery() || undefined,
        isActive: this.statusFilter() !== null ? this.statusFilter()! : undefined,
      })
      .subscribe({
        next: (response) => {
          this.items.set(response.data);
          this.totalItems.set(response.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorHandler.handle(err);
          this.isLoading.set(false);
        },
      });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onStatusFilter(isActive: boolean | null): void {
    this.statusFilter.set(isActive);
    this.currentPage.set(1);
    this.loadItems();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadItems();
  }

  handleDelete(page: Page): void {
    this.confirmDialog
      .confirm({
        title: 'Delete Page',
        message: `Are you sure you want to delete "${page.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.pageService.delete(page.id).subscribe({
          next: () => {
            this.items.update((list) => list.filter((p) => p.id !== page.id));
            this.totalItems.update((t) => t - 1);
            this.snackBar.open('Page deleted successfully', 'Close', {
              duration: 3000,
            });

            if (this.items().length === 0 && this.currentPage() > 1) {
              this.currentPage.update((p) => p - 1);
              this.loadItems();
            }
          },
          error: (err) => this.errorHandler.handle(err),
        });
      });
  }
}
