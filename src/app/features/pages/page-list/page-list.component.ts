import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../pages/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataTableState } from '../../../shared/utils/data-table-state';
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
    MatTooltipModule,
  ],
  templateUrl: './page-list.component.html',
  styleUrls: ['./page-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageListComponent implements OnInit {
  private readonly pageService = inject(PageService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly state = inject(DataTableState);

  readonly items = signal<Page[]>([]);
  readonly totalItems = signal(0);

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

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.state.isLoading.set(true);

    this.pageService
      .list(this.state.toListParams() as unknown as Parameters<typeof this.pageService.list>[0])
      .subscribe({
        next: (response) => {
          this.items.set(response.data);
          this.totalItems.set(response.total);
          this.state.isLoading.set(false);
        },
        error: (err) => {
          this.errorHandler.handle(err);
          this.state.isLoading.set(false);
        },
      });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.state.onSearch(input.value);
  }

  onStatusFilter(isActive: boolean | null): void {
    this.state.onStatusFilter(isActive);
    this.loadItems();
  }

  onPageChange(event: PageEvent): void {
    this.state.onPageChange(event);
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

            if (this.items().length === 0 && this.state.currentPage() > 1) {
              this.state.currentPage.update((p) => p - 1);
              this.loadItems();
            }
          },
          error: (err) => this.errorHandler.handle(err),
        });
      });
  }
}
