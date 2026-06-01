import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../users/user.service';
import { LevelService } from '../../levels/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { DataTableState } from '../../../shared/utils/data-table-state';
import type { User } from '../../../shared/models/user.model';
import type { Level } from '../../../shared/models/user.model';
import type { PaginatedResponse } from '../../../shared/models/api.model';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let levelService: jasmine.SpyObj<LevelService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let mockBreakpointObserver: { observe: jasmine.Spy };

  const mockUsers: User[] = [
    { id: 1, full_name: 'Active User', username: 'active', email: 'active@test.com', level_id: 1, is_active: true, created_at: null, updated_at: null },
    { id: 2, full_name: 'Inactive User', username: 'inactive', email: 'inactive@test.com', level_id: null, is_active: false, created_at: null, updated_at: null },
  ];

  const mockLevels: Level[] = [
    { id: 1, name: 'Admin', description: 'Admin', is_active: true, created_at: null, updated_at: null },
  ];

  const emptyResponse: PaginatedResponse<User> = { data: [], total: 0, page: 1, perPage: 15 };
  const pageResponse: PaginatedResponse<User> = { data: mockUsers, total: 2, page: 1, perPage: 15 };

  async function setupComponent(breakpointMatches = false): Promise<void> {
    mockBreakpointObserver = {
      observe: jasmine.createSpy('observe').and.returnValue(of({ matches: breakpointMatches })),
    };

    userService = jasmine.createSpyObj<UserService>('UserService', ['list']);
    userService.list.and.returnValue(of(emptyResponse));

    levelService = jasmine.createSpyObj<LevelService>('LevelService', ['list']);
    levelService.list.and.returnValue(of({ data: mockLevels, total: 1, page: 1, perPage: 100 }));

    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', ['handle', 'handleFormErrors', 'getErrorMessage']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        DataTableState,
        { provide: UserService, useValue: userService },
        { provide: LevelService, useValue: levelService },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  }

  it('should create', async () => {
    await setupComponent();
    expect(component).toBeTruthy();
  });

  it('should load users on init', async () => {
    await setupComponent();
    userService.list.and.returnValue(of(pageResponse));
    fixture.detectChanges();

    expect(userService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, perPage: 15 }),
    );
    expect(component.users()).toEqual(mockUsers);
    expect(component.totalItems()).toBe(2);
  });

  it('should load levels for dropdown on init', async () => {
    await setupComponent();
    fixture.detectChanges();

    expect(levelService.list).toHaveBeenCalledWith({ perPage: 100 });
    expect(component.levels()).toEqual(mockLevels);
  });

  it('should handle API errors via ErrorHandlerService', async () => {
    await setupComponent();
    const err = new HttpErrorResponse({ status: 500 });
    userService.list.and.returnValue(throwError(() => err));
    fixture.detectChanges();

    expect(errorHandler.handle).toHaveBeenCalledWith(err);
  });

  it('should apply inactive-row class on inactive users', async () => {
    await setupComponent();
    userService.list.and.returnValue(of(pageResponse));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    const inactiveRow = rows[1];
    expect(inactiveRow.classList).toContain('inactive-row');
  });

  it('should update level filter and reload users', async () => {
    await setupComponent();
    userService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    userService.list.calls.reset();

    component.onLevelFilter(1);

    expect(component.levelFilter()).toBe(1);
    expect(userService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ levelId: 1, page: 1 }),
    );
  });

  it('should update status filter and reload users', async () => {
    await setupComponent();
    userService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    userService.list.calls.reset();

    component.onStatusFilter(false);

    expect(component.state.statusFilter()).toBeFalse();
    expect(userService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ isActive: false, page: 1 }),
    );
  });

  it('should handle page change event', async () => {
    await setupComponent();
    userService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    userService.list.calls.reset();

    component.onPageChange({ pageIndex: 2, pageSize: 10, length: 0 });

    expect(component.state.currentPage()).toBe(3);
    expect(component.state.pageSize()).toBe(10);
    expect(userService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 3, perPage: 10 }),
    );
  });

  it('should get level name by id', async () => {
    await setupComponent();
    component.levels.set(mockLevels);

    expect(component.getLevelName(1)).toBe('Admin');
    expect(component.getLevelName(null)).toBe('—');
    expect(component.getLevelName(999)).toBe('—');
  });

  it('should show all columns on desktop', async () => {
    await setupComponent(false);
    fixture.detectChanges();
    expect(component.displayedColumns()).toEqual([
      'full_name', 'username', 'email', 'level', 'status', 'actions',
    ]);
  });

  it('should show essential columns on tablet', async () => {
    await setupComponent(true);
    fixture.detectChanges();
    expect(component.displayedColumns()).toEqual([
      'full_name', 'status', 'actions',
    ]);
  });
});
