import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should start with isLoading false', () => {
    expect(service.isLoading()).toBeFalse();
  });

  it('should set isLoading true when show is called', () => {
    service.show();
    expect(service.isLoading()).toBeTrue();
  });

  it('should set isLoading false when hide is called', () => {
    service.show();
    service.hide();
    expect(service.isLoading()).toBeFalse();
  });

  it('should track keyed loading state independently', () => {
    service.show('save');
    service.show('delete');
    expect(service.isLoading()).toBeTrue();

    service.hide('save');
    expect(service.isLoading()).toBeTrue();

    service.hide('delete');
    expect(service.isLoading()).toBeFalse();
  });

  it('should report per-key loading state', () => {
    service.show('save');
    service.show('delete');

    expect(service.isLoadingKey('save')()).toBeTrue();
    expect(service.isLoadingKey('delete')()).toBeTrue();
    expect(service.isLoadingKey('other')()).toBeFalse();
  });
});
