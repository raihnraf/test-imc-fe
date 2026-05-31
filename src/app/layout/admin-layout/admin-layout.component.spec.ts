import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import type { User } from '../../shared/models/auth.model';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: 1,
    full_name: 'Admin User',
    username: 'admin',
    level_id: 1,
  };

  function setupWithPermissions(perms: Record<string, boolean>): void {
    TestBed.resetTestingModule();

    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
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
      '/users': true,
      '/levels': false,
      '/pages': true,
    });

    const navLinks = fixture.nativeElement.querySelectorAll('a[mat-list-item]');
    expect(navLinks.length).toBe(2);

    const texts = (Array.from(navLinks) as HTMLElement[]).map((el) => el.textContent?.trim());
    expect(texts).toContain('peopleUsers');
    expect(texts).toContain('descriptionPages');
    expect(texts).not.toContain('layersLevels');
  });

  it('should hide nav items with permission false', () => {
    setupWithPermissions({
      '/users': false,
      '/levels': false,
      '/pages': false,
    });

    const navLinks = fixture.nativeElement.querySelectorAll('a[mat-list-item]');
    expect(navLinks.length).toBe(0);
  });

  it('should render toolbar title', () => {
    setupWithPermissions({});
    const title = fixture.nativeElement.querySelector('.toolbar-title');
    expect(title.textContent).toContain('IMC Admin');
  });
});
