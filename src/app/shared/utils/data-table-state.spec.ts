import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DataTableState } from './data-table-state';

describe('DataTableState', () => {
  function createState(): DataTableState {
    return TestBed.runInInjectionContext(() => new DataTableState());
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should create with default values', () => {
    const state = createState();
    expect(state.currentPage()).toBe(1);
    expect(state.pageSize()).toBe(15);
    expect(state.statusFilter()).toBeNull();
    expect(state.isLoading()).toBeFalse();
    expect(state.searchQuery()).toBe('');
  });

  it('should update page and size on page change', () => {
    const state = createState();
    state.onPageChange({ pageIndex: 2, pageSize: 10, length: 0 });
    expect(state.currentPage()).toBe(3);
    expect(state.pageSize()).toBe(10);
  });

  it('should update status filter and reset page', () => {
    const state = createState();
    state.currentPage.set(5);
    state.onStatusFilter(false);
    expect(state.statusFilter()).toBeFalse();
    expect(state.currentPage()).toBe(1);
  });

  it('should debounce search and reset page', fakeAsync(() => {
    const state = createState();
    state.currentPage.set(3);
    state.onSearch('test');
    tick(299);
    expect(state.searchQuery()).toBe('');
    expect(state.currentPage()).toBe(3);
    tick(1);
    expect(state.searchQuery()).toBe('test');
    expect(state.currentPage()).toBe(1);
  }));

  it('should build list params with defaults', () => {
    const state = createState();
    const params = state.toListParams();
    expect(params).toEqual({ page: 1, perPage: 15 });
  });

  it('should include search in params when set', fakeAsync(() => {
    const state = createState();
    state.onSearch('hello');
    tick(300);
    const params = state.toListParams();
    expect(params['search']).toBe('hello');
  }));

  it('should include isActive in params when filter set', () => {
    const state = createState();
    state.onStatusFilter(true);
    const params = state.toListParams();
    expect(params['isActive']).toBeTrue();
  });

  it('should merge extra params', () => {
    const state = createState();
    const params = state.toListParams({ levelId: 5 });
    expect(params).toEqual({ page: 1, perPage: 15, levelId: 5 });
  });

  it('should exclude null/undefined extra params', () => {
    const state = createState();
    const params = state.toListParams({ levelId: null, foo: undefined, bar: 3 });
    expect(params).toEqual({ page: 1, perPage: 15, bar: 3 });
  });

  it('should toggle loading state', () => {
    const state = createState();
    state.isLoading.set(true);
    expect(state.isLoading()).toBeTrue();
    state.isLoading.set(false);
    expect(state.isLoading()).toBeFalse();
  });

  it('should reset page to 1', () => {
    const state = createState();
    state.currentPage.set(5);
    state.resetPage();
    expect(state.currentPage()).toBe(1);
  });
});
