import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
})
export class LevelPermissionMatrixComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly levelId = signal<number | null>(null);
  readonly matrix = signal<PermissionEntry[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal<Record<number, boolean>>({});

  readonly displayedColumns: string[] = ['name', 'route_path', 'has_access'];

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
    if (!this.levelId()) return;
    this.isSaving.update((s) => ({ ...s, [entry.id]: true }));

    const request$ = checked
      ? this.permissionService.grantLevelPermission(this.levelId()!, entry.id)
      : this.permissionService.revokeLevelPermission(this.levelId()!, entry.id);

    request$.subscribe({
      next: () => {
        this.matrix.update((m) =>
          m.map((e) => (e.id === entry.id ? { ...e, has_access: checked } : e)),
        );
        this.isSaving.update((s) => ({ ...s, [entry.id]: false }));
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.isSaving.update((s) => ({ ...s, [entry.id]: false }));
        this.matrix.update((m) =>
          m.map((e) => (e.id === entry.id ? { ...e, has_access: !checked } : e)),
        );
      },
    });
  }
}
