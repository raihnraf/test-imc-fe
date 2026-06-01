import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, forkJoin, EMPTY } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../../core/services/permission.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import type { PermissionEntry } from '../../../shared/models/permission.model';


@Component({
  selector: 'app-level-permission-matrix',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './level-permission-matrix.component.html',
  styleUrls: ['./level-permission-matrix.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelPermissionMatrixComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly levelId = signal<number | null>(null);
  readonly matrix = signal<PermissionEntry[]>([]);
  readonly isLoading = signal(false);
  readonly isSavingAll = signal(false);
  readonly pendingChanges = signal<Map<number, boolean>>(new Map());

  private readonly flushSubject = new Subject<void>();

  readonly hasPendingChanges = computed(() => this.pendingChanges().size > 0);
  readonly pendingCount = computed(() => this.pendingChanges().size);

  readonly displayedColumns: string[] = ['name', 'route_path', 'has_access'];

  constructor() {
    this.flushSubject
      .pipe(
        debounceTime(500),
        switchMap(() => this.flushPendingChanges()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.levelId.set(Number(id));
      this.loadMatrix();
    }
  }

  loadMatrix(): void {
    if (!this.levelId()) return;
    this.isLoading.set(true);
    this.permissionService.loadLevelMatrix(this.levelId()!).subscribe({
      next: (entries) => {
        this.matrix.set(entries);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.isLoading.set(false);
      },
    });
  }

  onToggle(entry: PermissionEntry, checked: boolean): void {
    const updated = new Map(this.pendingChanges());
    updated.set(entry.id, checked);
    this.pendingChanges.set(updated);
    this.matrix.update((m) =>
      m.map((e) => (e.id === entry.id ? { ...e, has_access: checked } : e)),
    );
    this.flushSubject.next();
  }

  saveNow(): void {
    this.flushSubject.next();
  }

  private flushPendingChanges() {
    const changes = this.pendingChanges();
    if (changes.size === 0 || !this.levelId()) {
      return EMPTY;
    }

    this.isSavingAll.set(true);
    const entries = Array.from(changes.entries());
    this.pendingChanges.set(new Map());

    const requests = entries.map(([entryId, checked]) =>
      (checked
        ? this.permissionService.grantLevelPermission(this.levelId()!, entryId)
        : this.permissionService.revokeLevelPermission(this.levelId()!, entryId)
      ).pipe(
        catchError((err) => {
          this.errorHandler.handle(err);
          return EMPTY;
        }),
      ),
    );

    return forkJoin(requests).pipe(
      catchError(() => EMPTY),
    );
  }
}
