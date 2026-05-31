import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LevelListComponent } from './level-list.component';
import { LevelService } from '../../../shared/services/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import type { Level } from '../../../shared/models/user.model';
import type { PaginatedResponse } from '../../../shared/models/api.model';

describe('LevelListComponent', () => {
  let component: LevelListComponent;
  let fixture: ComponentFixture<LevelListComponent>;
  let levelService: jasmine.SpyObj<LevelService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  const mockLevels: Level[] = [
    { id: 1, name: 'Admin', description: 'Administrator', is_active: true, created_at: null, updated_at: null },
    { id: 2, name: 'User', description: 'Regular user', is_active: false, created_at: null, updated_at: null },
  ];

  const emptyResponse: PaginatedResponse<Level> = { data: [], total: 0, page: 1, perPage: 15 };
  const pageResponse: PaginatedResponse<Level> = { data: mockLevels, total: 2, page: 1, perPage: 15 };

  beforeEach(async () => {
    levelService = jasmine.createSpyObj<LevelService>('LevelService', ['list']);
    levelService.list.and.returnValue(of(emptyResponse));

    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', ['handle', 'handleFormErrors', 'getErrorMessage']);

    await TestBed.configureTestingModule({
      imports: [LevelListComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: LevelService, useValue: levelService },
        { provide: ErrorHandlerService, useValue: errorHandler },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LevelListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load levels on init', () => {
    levelService.list.and.returnValue(of(pageResponse));
    fixture.detectChanges();

    expect(levelService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, perPage: 15 }),
    );
    expect(component.items()).toEqual(mockLevels);
    expect(component.totalItems()).toBe(2);
  });

  it('should handle API errors via ErrorHandlerService', () => {
    const err = new HttpErrorResponse({ status: 500 });
    levelService.list.and.returnValue(throwError(() => err));
    fixture.detectChanges();

    expect(errorHandler.handle).toHaveBeenCalledWith(err);
  });

  it('should apply inactive-row class on inactive levels', () => {
    levelService.list.and.returnValue(of(pageResponse));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    const inactiveRow = rows[1];
    expect(inactiveRow.classList).toContain('inactive-row');
  });

  it('should update status filter and reload levels', () => {
    levelService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    levelService.list.calls.reset();

    component.onStatusFilter(false);

    expect(component.statusFilter()).toBeFalse();
    expect(levelService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ isActive: false, page: 1 }),
    );
  });

  it('should handle page change event', () => {
    levelService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    levelService.list.calls.reset();

    component.onPageChange({ pageIndex: 2, pageSize: 10, length: 0 });

    expect(component.currentPage()).toBe(3);
    expect(component.pageSize()).toBe(10);
    expect(levelService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 3, perPage: 10 }),
    );
  });

  it('should show search field and create button', () => {
    levelService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.search-field')).toBeTruthy();
    expect(compiled.querySelector('button[color="primary"]')).toBeTruthy();
  });
});
