import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { LevelService } from '../../features/levels/level.service';
import { PERMISSION_KEYS } from '../../core/constants/permission-keys';
import type { AuthUser } from '../../shared/models/auth.model';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser: AuthUser = {
    id: 1,
    full_name: 'Admin User',
    username: 'admin',
    level_id: 1,
  };

  const mockBreakpointObserver = {
    observe: jasmine.createSpy('observe').and.returnValue(of({ matches: false })),
  };

  const mockLevelService = jasmine.createSpyObj<LevelService>('LevelService', ['list']);
  mockLevelService.list.and.returnValue(of({ data: [], total: 0, page: 1, perPage: 100 }));

  function setupWithPermissions(perms: Record<string, boolean>): void {
    TestBed.resetTestingModule();

    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    authService.logout.and.returnValue(of(undefined));
    Object.defineProperty(authService, 'user', {
      value: signal(mockUser).asReadonly(),
    });

    const permSpy = jasmine.createSpyObj<PermissionService>('PermissionService', [], {
      permissions: signal(perms).asReadonly(),
    });

    TestBed.configureTestingModule({
      imports: [AdminLayoutComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: PermissionService, useValue: permSpy },
        { provide: LevelService, useValue: mockLevelService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setupWithPermissions({});
    expect(component).toBeTruthy();
  });

  it('should display full_name from AuthService user', () => {
    setupWithPermissions({});
    expect(component.displayName()).toBe('Admin User');
  });

  it('should call authService.logout when handleLogout is called', () => {
    setupWithPermissions({});
    component.handleLogout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should render nav items that have permission true', () => {
    setupWithPermissions({
      [PERMISSION_KEYS.USERS]: true,
      [PERMISSION_KEYS.LEVELS]: false,
      [PERMISSION_KEYS.PAGES]: true,
    });

    const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
    // Dashboard always renders (permission: ''), plus Users and Pages
    expect(navLinks.length).toBe(3);

    const labels = (Array.from(navLinks) as HTMLElement[]).map((el) =>
      el.querySelector('.nav-link-label')?.textContent?.trim() ?? '',
    );
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Users');
    expect(labels).toContain('Pages');
    expect(labels).not.toContain('Levels');
  });

  it('should hide nav items with permission false', () => {
    setupWithPermissions({
      [PERMISSION_KEYS.USERS]: false,
      [PERMISSION_KEYS.LEVELS]: false,
      [PERMISSION_KEYS.PAGES]: false,
    });

    const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
    // Dashboard always renders (permission: '')
    expect(navLinks.length).toBe(1);
    expect(
      (Array.from(navLinks) as HTMLElement[]).map((el) =>
        el.querySelector('.nav-link-label')?.textContent?.trim() ?? '',
      ),
    ).toContain('Dashboard');
  });

  it('should render toolbar title', () => {
    setupWithPermissions({});
    const title = fixture.nativeElement.querySelector('.toolbar-title');
    expect(title.textContent).toContain('User Management');
  });

  it('should return side mode when not on tablet', () => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false }));
    setupWithPermissions({});
    expect(component.sidenavMode()).toBe('side');
  });

  it('should return over mode when on tablet', () => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: true }));
    setupWithPermissions({});
    expect(component.sidenavMode()).toBe('over');
  });

  it('should start sidenav closed on tablet', () => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: true }));
    setupWithPermissions({});
    fixture.detectChanges();
    expect(component.sidenavOpened()).toBe(false);
  });

  it('should start sidenav open on desktop', () => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false }));
    setupWithPermissions({});
    expect(component.sidenavOpened()).toBe(true);
  });

  it('should toggle sidenav user opened state', () => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false }));
    setupWithPermissions({});
    expect(component.sidenavUserOpened()).toBe(true);
    component.toggleSidenav();
    expect(component.sidenavUserOpened()).toBe(false);
    component.toggleSidenav();
    expect(component.sidenavUserOpened()).toBe(true);
  });
});
