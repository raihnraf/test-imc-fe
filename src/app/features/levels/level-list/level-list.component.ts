import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { LevelService } from '../../levels/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataTableState } from '../../../shared/utils/data-table-state';
import type { Level } from '../../../shared/models/user.model';

@Component({
  selector: 'app-level-list',
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
  templateUrl: './level-list.component.html',
  styleUrls: ['./level-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelListComponent implements OnInit {
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly state = inject(DataTableState);

  readonly items = signal<Level[]>([]);
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

  readonly desktopColumns = ['name', 'description', 'status', 'actions'];
  readonly tabletColumns = ['name', 'status', 'actions'];
  readonly displayedColumns = computed(() =>
    this.isTablet() ? this.tabletColumns : this.desktopColumns,
  );

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.state.isLoading.set(true);

    this.levelService
      .list(this.state.toListParams() as unknown as Parameters<typeof this.levelService.list>[0])
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

  handleDelete(level: Level): void {
    this.confirmDialog
      .confirm({
        title: 'Delete Level',
        message: `Are you sure you want to delete "${level.name}"? If users are assigned to this level, deletion will be blocked.`,
        confirmText: 'Delete',
        color: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.levelService.delete(level.id).subscribe({
          next: () => {
            this.items.update((list) => list.filter((l) => l.id !== level.id));
            this.totalItems.update((t) => t - 1);
            this.snackBar.open('Level deleted successfully', 'Close', {
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

  handlePermissions(level: Level): void {
    this.router.navigate(['/admin/levels', level.id, 'permissions']);
  }
}
