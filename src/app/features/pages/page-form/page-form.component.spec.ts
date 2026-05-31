import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { PageFormComponent } from './page-form.component';
import { PageService } from '../../../shared/services/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';

describe('PageFormComponent', () => {
  let component: PageFormComponent;
  let fixture: ComponentFixture<PageFormComponent>;
  let pageService: jasmine.SpyObj<PageService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    pageService = jasmine.createSpyObj<PageService>('PageService', ['list', 'getById', 'create', 'update', 'delete']);
    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', ['handle', 'handleFormErrors', 'getErrorMessage']);

    await TestBed.configureTestingModule({
      imports: [PageFormComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: PageService, useValue: pageService },
        { provide: ErrorHandlerService, useValue: errorHandler },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have form controls for page fields', () => {
    expect(component.form.contains('name')).toBeTrue();
    expect(component.form.contains('route_path')).toBeTrue();
    expect(component.form.contains('description')).toBeTrue();
    expect(component.form.contains('display_order')).toBeTrue();
    expect(component.form.contains('is_active')).toBeTrue();
  });

  it('should require name and route_path', () => {
    component.form.get('name')?.setValue('');
    component.form.get('route_path')?.setValue('');
    expect(component.form.get('name')?.valid).toBeFalse();
    expect(component.form.get('route_path')?.valid).toBeFalse();
  });

  it('should validate route_path starts with / and has no spaces', () => {
    const control = component.form.get('route_path');

    control?.setValue('no-slash');
    expect(control?.hasError('pattern')).toBeTrue();

    control?.setValue('/with space');
    expect(control?.hasError('pattern')).toBeTrue();

    control?.setValue('/valid-path');
    expect(control?.hasError('pattern')).toBeFalse();

    control?.setValue('/dashboard');
    expect(control?.hasError('pattern')).toBeFalse();
  });

  it('should validate display_order min 0', () => {
    const control = component.form.get('display_order');

    control?.setValue(-1);
    expect(control?.hasError('min')).toBeTrue();

    control?.setValue(0);
    expect(control?.hasError('min')).toBeFalse();

    control?.setValue(5);
    expect(control?.valid).toBeTrue();
  });

  it('should show Create Page title by default', () => {
    fixture.detectChanges();
    expect(component.pageTitle()).toBe('Create Page');
    expect(component.isEditMode()).toBeFalse();
  });

  it('should mark form invalid when required fields empty', () => {
    fixture.detectChanges();
    component.form.get('name')?.setValue('');
    component.form.get('route_path')?.setValue('');
    expect(component.form.valid).toBeFalse();
  });

  it('should mark form valid with required fields', () => {
    component.form.patchValue({ name: 'Dashboard', route_path: '/dashboard' });
    expect(component.form.valid).toBeTrue();
  });
});
