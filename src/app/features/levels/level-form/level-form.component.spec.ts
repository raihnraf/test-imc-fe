import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { LevelFormComponent } from './level-form.component';
import { LevelService } from '../../../shared/services/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';

describe('LevelFormComponent', () => {
  let component: LevelFormComponent;
  let fixture: ComponentFixture<LevelFormComponent>;
  let levelService: jasmine.SpyObj<LevelService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    levelService = jasmine.createSpyObj<LevelService>('LevelService', ['list', 'getById', 'create', 'update', 'delete']);
    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', ['handle', 'handleFormErrors', 'getErrorMessage']);

    await TestBed.configureTestingModule({
      imports: [LevelFormComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: LevelService, useValue: levelService },
        { provide: ErrorHandlerService, useValue: errorHandler },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LevelFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have a form with name, description, and is_active controls', () => {
    expect(component.form.contains('name')).toBeTrue();
    expect(component.form.contains('description')).toBeTrue();
    expect(component.form.contains('is_active')).toBeTrue();
  });

  it('should require name field', () => {
    const nameControl = component.form.get('name');
    nameControl?.setValue('');
    expect(nameControl?.valid).toBeFalse();
    expect(nameControl?.hasError('required')).toBeTrue();
  });

  it('should validate name max length', () => {
    const nameControl = component.form.get('name');
    nameControl?.setValue('a'.repeat(101));
    expect(nameControl?.valid).toBeFalse();
    expect(nameControl?.hasError('maxlength')).toBeTrue();
  });

  it('should default is_active to true', () => {
    fixture.detectChanges();
    expect(component.form.get('is_active')?.value).toBeTrue();
  });

  it('should show page title "Create Level" by default', () => {
    fixture.detectChanges();
    expect(component.pageTitle()).toBe('Create Level');
    expect(component.isEditMode()).toBeFalse();
  });

  it('should mark form as invalid when empty', () => {
    fixture.detectChanges();
    component.form.get('name')?.setValue('');
    expect(component.form.valid).toBeFalse();
  });

  it('should mark form as valid with required fields', () => {
    component.form.patchValue({ name: 'Valid Name' });
    expect(component.form.valid).toBeTrue();
  });
});
