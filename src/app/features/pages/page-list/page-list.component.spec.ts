import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { PageListComponent } from './page-list.component';
import { PageService } from '../../pages/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { DataTableState } from '../../../shared/utils/data-table-state';
import type { Page } from '../../../shared/models/page.model';
import type { PaginatedResponse } from '../../../shared/models/api.model';

describe('PageListComponent', () => {
  let component: PageListComponent;
  let fixture: ComponentFixture<PageListComponent>;
  let pageService: jasmine.SpyObj<PageService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let mockBreakpointObserver: { observe: jasmine.Spy };

  const mockPages: Page[] = [
    { id: 1, name: 'Dashboard', route_path: '/dashboard', description: 'Main dashboard', display_order: 1, is_active: true, created_at: null, updated_at: null },
    { id: 2, name: 'Settings', route_path: '/settings', description: 'Settings page', display_order: 2, is_active: false, created_at: null, updated_at: null },
  ];

  const emptyResponse: PaginatedResponse<Page> = { data: [], total: 0, page: 1, perPage: 15 };
  const pageResponse: PaginatedResponse<Page> = { data: mockPages, total: 2, page: 1, perPage: 15 };

  async function setupComponent(breakpointMatches = false): Promise<void> {
    mockBreakpointObserver = {
      observe: jasmine.createSpy('observe').and.returnValue(of({ matches: breakpointMatches })),
    };

    pageService = jasmine.createSpyObj<PageService>('PageService', ['list']);
    pageService.list.and.returnValue(of(emptyResponse));

    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', ['handle', 'handleFormErrors', 'getErrorMessage']);

    await TestBed.configureTestingModule({
      imports: [PageListComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        DataTableState,
        { provide: PageService, useValue: pageService },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageListComponent);
    component = fixture.componentInstance;
  }

  it('should create', async () => {
    await setupComponent();
    expect(component).toBeTruthy();
  });

  it('should load pages on init', async () => {
    await setupComponent();
    pageService.list.and.returnValue(of(pageResponse));
    fixture.detectChanges();

    expect(pageService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, perPage: 15 }),
    );
    expect(component.items()).toEqual(mockPages);
    expect(component.totalItems()).toBe(2);
  });

  it('should handle API errors via ErrorHandlerService', async () => {
    await setupComponent();
    const err = new HttpErrorResponse({ status: 500 });
    pageService.list.and.returnValue(throwError(() => err));
    fixture.detectChanges();

    expect(errorHandler.handle).toHaveBeenCalledWith(err);
  });

  it('should apply inactive-row class on inactive pages', async () => {
    await setupComponent();
    pageService.list.and.returnValue(of(pageResponse));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    const inactiveRow = rows[1];
    expect(inactiveRow.classList).toContain('inactive-row');
  });

  it('should update status filter and reload pages', async () => {
    await setupComponent();
    pageService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    pageService.list.calls.reset();

    component.onStatusFilter(false);

    expect(component.state.statusFilter()).toBeFalse();
    expect(pageService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ isActive: false, page: 1 }),
    );
  });

  it('should handle page change event', async () => {
    await setupComponent();
    pageService.list.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    pageService.list.calls.reset();

    component.onPageChange({ pageIndex: 2, pageSize: 10, length: 0 });

    expect(component.state.currentPage()).toBe(3);
    expect(component.state.pageSize()).toBe(10);
    expect(pageService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 3, perPage: 10 }),
    );
  });

  it('should show all columns on desktop', async () => {
    await setupComponent(false);
    fixture.detectChanges();
    expect(component.displayedColumns()).toEqual([
      'name', 'route_path', 'display_order', 'status', 'actions',
    ]);
  });

  it('should show essential columns on tablet', async () => {
    await setupComponent(true);
    fixture.detectChanges();
    expect(component.displayedColumns()).toEqual([
      'name', 'status', 'actions',
    ]);
  });
});
