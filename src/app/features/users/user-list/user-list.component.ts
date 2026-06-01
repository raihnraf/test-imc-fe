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
import { UserService } from '../../users/user.service';
import { LevelService } from '../../levels/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataTableState } from '../../../shared/utils/data-table-state';
import type { User } from '../../../shared/models/user.model';
import type { Level } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-list',
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
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly state = inject(DataTableState);

  readonly users = signal<User[]>([]);
  readonly totalItems = signal(0);
  readonly levels = signal<Level[]>([]);
  readonly levelFilter = signal<number | null>(null);

  readonly isTablet = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(
        map((result) => result.matches),
        startWith(false),
      ),
    { initialValue: false },
  );

  readonly desktopColumns = ['full_name', 'username', 'email', 'level', 'status', 'actions'];
  readonly tabletColumns = ['full_name', 'status', 'actions'];
  readonly displayedColumns = computed(() =>
    this.isTablet() ? this.tabletColumns : this.desktopColumns,
  );

  ngOnInit(): void {
    this.loadLevels();
    this.loadUsers();
  }

  loadUsers(): void {
    this.state.isLoading.set(true);

    const levelId = this.levelFilter();
    this.userService
      .list(this.state.toListParams({ levelId }) as unknown as Parameters<typeof this.userService.list>[0])
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.totalItems.set(response.total);
          this.state.isLoading.set(false);
        },
        error: (err) => {
          this.errorHandler.handle(err);
          this.state.isLoading.set(false);
        },
      });
  }

  private loadLevels(): void {
    this.levelService.list({ perPage: 100 }).subscribe({
      next: (response) => this.levels.set(response.data),
      error: (err) => this.errorHandler.handle(err),
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.state.onSearch(input.value);
  }

  onStatusFilter(isActive: boolean | null): void {
    this.state.onStatusFilter(isActive);
    this.loadUsers();
  }

  onLevelFilter(levelId: number | null): void {
    this.levelFilter.set(levelId);
    this.state.resetPage();
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.state.onPageChange(event);
    this.loadUsers();
  }

  getLevelName(levelId: number | null): string {
    if (levelId === null) return '—';
    const level = this.levels().find((l) => l.id === levelId);
    return level?.name ?? '—';
  }

  handleDelete(user: User): void {
    this.confirmDialog
      .confirm({
        title: 'Delete User',
        message: `Are you sure you want to delete "${user.full_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.userService.delete(user.id).subscribe({
          next: () => {
            this.users.update((list) => list.filter((u) => u.id !== user.id));
            this.totalItems.update((t) => t - 1);
            this.snackBar.open('User deleted successfully', 'Close', {
              duration: 3000,
            });

            if (this.users().length === 0 && this.state.currentPage() > 1) {
              this.state.currentPage.update((p) => p - 1);
              this.loadUsers();
            }
          },
          error: (err) => this.errorHandler.handle(err),
        });
      });
  }
}
