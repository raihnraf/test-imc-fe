import { Component, computed, signal, effect, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { LevelService } from '../../shared/services/level.service';
import type { NavItem } from '../../shared/models/permission.model';
import type { Level } from '../../shared/models/user.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly levelService = inject(LevelService);
  readonly permissionService = inject(PermissionService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isTablet = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(
        map((result) => result.matches),
        startWith(false),
      ),
    { initialValue: false },
  );

  readonly sidenavMode = computed(() => (this.isTablet() ? 'over' : 'side'));
  readonly sidenavUserOpened = signal(true);
  readonly sidenavOpened = computed(() => this.sidenavUserOpened());
  readonly displayName = computed(() => this.authService.user()?.full_name ?? 'User');

  readonly levels = signal<Level[]>([]);
  readonly levelName = computed(() => {
    const id = this.authService.user()?.level_id;
    if (!id) return '';
    return this.levels().find((l) => l.id === id)?.name ?? '';
  });

  constructor() {
    effect(() => {
      if (this.isTablet()) {
        this.sidenavUserOpened.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.levelService.list({ perPage: 100 }).subscribe({
      next: (res) => this.levels.set(res.data),
    });
  }

  readonly navItems: NavItem[] = [
    { route: '/admin/users', label: 'Users', icon: 'people', permission: '/users' },
    { route: '/admin/levels', label: 'Levels', icon: 'layers', permission: '/levels' },
    { route: '/admin/pages', label: 'Pages', icon: 'description', permission: '/pages' },
  ];

  toggleSidenav(): void {
    this.sidenavUserOpened.update((v) => !v);
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
