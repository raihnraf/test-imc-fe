import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LevelService } from '../../../shared/services/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
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
})
export class LevelListComponent implements OnInit, OnDestroy {
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly items = signal<Level[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly isLoading = signal(false);
  readonly statusFilter = signal<boolean | null>(null);
  private searchQuery = signal('');

  readonly displayedColumns: string[] = [
    'name',
    'description',
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

    this.levelService
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

            if (this.items().length === 0 && this.currentPage() > 1) {
              this.currentPage.update((p) => p - 1);
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
