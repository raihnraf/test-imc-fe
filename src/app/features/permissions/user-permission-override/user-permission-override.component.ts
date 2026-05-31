import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../../core/services/permission.service';
import { PageService } from '../../../shared/services/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import type { PermissionEntry } from '../../../shared/models/permission.model';
import type { UserPermissionOverride } from '../../../shared/models/permission.model';
import type { Page } from '../../../shared/models/page.model';

@Component({
  selector: 'app-user-permission-override',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTabsModule,
    MatTableModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './user-permission-override.component.html',
  styleUrls: ['./user-permission-override.component.scss'],
})
export class UserPermissionOverrideComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly pageService = inject(PageService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly userId = signal<number | null>(null);
  readonly effectivePermissions = signal<PermissionEntry[]>([]);
  readonly overrides = signal<UserPermissionOverride[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal<Record<number, boolean>>({});
  readonly activeTab = signal(0);
  readonly selectedPageId = signal<number | null>(null);
  readonly selectedAccess = signal(true);

  readonly effectiveColumns: string[] = ['name', 'route_path', 'has_access'];
  readonly overrideColumns: string[] = ['name', 'route_path', 'override_type', 'actions'];

  readonly nonOverriddenPages = computed(() => {
    const overridePageIds = new Set(this.overrides().map((o) => o.page_id));
    return this.effectivePermissions().filter((p) => !overridePageIds.has(p.id));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(Number(id));
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.userId()) return;
    this.isLoading.set(true);
    this.loadOverrides();
  }

  private loadOverrides(): void {
    if (!this.userId()) return;
    this.permissionService.loadUserOverrides(this.userId()!).subscribe({
      next: (result) => {
        this.overrides.set(result);
        this.loadEffectivePermissions();
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.isLoading.set(false);
      },
    });
  }

  private loadEffectivePermissions(): void {
    this.pageService.list({ perPage: 100 }).subscribe({
      next: (response) => {
        const perms = this.permissionService.permissions();
        const entries: PermissionEntry[] = response.data.map((page) => ({
          id: page.id,
          name: page.name,
          route_path: page.route_path,
          has_access: perms[page.route_path] === true,
        }));
        this.effectivePermissions.set(entries);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.isLoading.set(false);
      },
    });
  }

  onGrantOverride(pageId: number, isGranted: boolean): void {
    if (!this.userId()) return;
    this.isSaving.update((s) => ({ ...s, [pageId]: true }));

    this.permissionService
      .grantUserPermission(this.userId()!, pageId, isGranted)
      .subscribe({
        next: () => {
          this.loadOverrides();
          this.isSaving.update((s) => ({ ...s, [pageId]: false }));
          this.snackBar.open('Override added', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.errorHandler.handle(err);
          this.isSaving.update((s) => ({ ...s, [pageId]: false }));
        },
      });
  }

  onRemoveOverride(override: UserPermissionOverride): void {
    if (!this.userId()) return;
    this.confirmDialog
      .confirm({
        title: 'Remove Override',
        message: `Remove permission override for "${override.page_name}"? This will revert to level default.`,
        confirmText: 'Remove',
        color: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.permissionService
          .removeUserOverride(this.userId()!, override.page_id)
          .subscribe({
            next: () => {
              this.overrides.update((list) =>
                list.filter((o) => o.id !== override.id),
              );
              this.loadEffectivePermissions();
              this.snackBar.open('Override removed', 'Close', { duration: 3000 });
            },
            error: (err) => this.errorHandler.handle(err),
          });
      });
  }

  onAddOverride(): void {
    const pageId = this.selectedPageId();
    if (pageId === null || !this.userId()) return;
    this.onGrantOverride(pageId, this.selectedAccess());
    this.selectedPageId.set(null);
  }
}
