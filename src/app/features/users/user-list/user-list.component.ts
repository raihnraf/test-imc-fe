import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
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
import { UserService } from '../../../shared/services/user.service';
import { LevelService } from '../../../shared/services/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly users = signal<User[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly isLoading = signal(false);
  readonly levels = signal<Level[]>([]);
  readonly levelFilter = signal<number | null>(null);
  readonly statusFilter = signal<boolean | null>(null);
  private searchQuery = signal('');

  readonly displayedColumns: string[] = [
    'full_name',
    'username',
    'email',
    'level',
    'status',
    'actions',
  ];

  private searchSubject = new Subject<string>();
  private searchSub: Subscription;

  constructor() {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.currentPage.set(1);
        this.loadUsers();
      });
  }

  ngOnInit(): void {
    this.loadLevels();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
  }

  loadUsers(): void {
    this.isLoading.set(true);

    this.userService
      .list({
        page: this.currentPage(),
        perPage: this.pageSize(),
        search: this.searchQuery() || undefined,
        isActive: this.statusFilter() !== null ? this.statusFilter()! : undefined,
        levelId: this.levelFilter() !== null ? this.levelFilter()! : undefined,
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.totalItems.set(response.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorHandler.handle(err);
          this.isLoading.set(false);
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
    this.searchSubject.next(input.value);
  }

  onLevelFilter(levelId: number | null): void {
    this.levelFilter.set(levelId);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onStatusFilter(isActive: boolean | null): void {
    this.statusFilter.set(isActive);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
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

            if (this.users().length === 0 && this.currentPage() > 1) {
              this.currentPage.update((p) => p - 1);
              this.loadUsers();
            }
          },
          error: (err) => this.errorHandler.handle(err),
        });
      });
  }
}
