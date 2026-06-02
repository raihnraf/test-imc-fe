import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserFormComponent } from './user-form.component';
import { UserService } from '../../users/user.service';
import { LevelService } from '../../levels/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { User } from '../../../shared/models/user.model';
import type { Level } from '../../../shared/models/user.model';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let levelService: jasmine.SpyObj<LevelService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser: User = {
    id: 1,
    full_name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    level_id: 1,
    is_active: true,
    created_at: null,
    updated_at: null,
  };

  const mockLevels: Level[] = [
    { id: 1, name: 'Admin', description: 'Admin', is_active: true, created_at: null, updated_at: null },
  ];

  function setupCreateMode(): void {
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'list',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    userService.create.and.returnValue(of(mockUser));
    userService.list.and.returnValue(of({ data: [], total: 0, page: 1, perPage: 15 }));

    levelService = jasmine.createSpyObj<LevelService>('LevelService', ['listCached']);
    levelService.listCached.and.returnValue(of(mockLevels));

    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', [
      'handle',
      'handleFormErrors',
      'handleFormSubmitError',
      'getErrorMessage',
    ]);
    errorHandler.handleFormErrors.and.returnValue({});

    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [UserFormComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: LevelService, useValue: levelService },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function setupEditMode(): void {
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'list',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    userService.getById.and.returnValue(of(mockUser));
    userService.update.and.returnValue(of(mockUser));
    userService.list.and.returnValue(of({ data: [], total: 0, page: 1, perPage: 15 }));

    levelService = jasmine.createSpyObj<LevelService>('LevelService', ['listCached']);
    levelService.listCached.and.returnValue(of(mockLevels));

    errorHandler = jasmine.createSpyObj<ErrorHandlerService>('ErrorHandlerService', [
      'handle',
      'handleFormErrors',
      'handleFormSubmitError',
      'getErrorMessage',
    ]);
    errorHandler.handleFormErrors.and.returnValue({});

    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [UserFormComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: LevelService, useValue: levelService },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '1' }) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => setupCreateMode());

    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should show Create User title', () => {
      expect(component.pageTitle()).toBe('Create User');
      expect(component.isEditMode()).toBeFalse();
    });

    it('should require full_name, username, email, and password', () => {
      expect(component.form.get('full_name')?.validator).toBeTruthy();
      expect(component.form.get('username')?.validator).toBeTruthy();
      expect(component.form.get('email')?.validator).toBeTruthy();
      expect(component.form.get('password')?.hasValidator(Validators.required)).toBeTrue();
    });

    it('should call UserService.create on valid submit', () => {
      component.form.patchValue({
        full_name: 'New User',
        username: 'newuser',
        email: 'new@test.com',
        password: 'secret123',
        level_id: null,
        is_active: true,
      });

      component.onSubmit();

      expect(userService.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          full_name: 'New User',
          username: 'newuser',
          email: 'new@test.com',
          password: 'secret123',
        }),
      );
    });

    it('should not call UserService.create on invalid form', () => {
      component.onSubmit();
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => setupEditMode());

    it('should show Edit User title', () => {
      expect(component.pageTitle()).toBe('Edit User');
      expect(component.isEditMode()).toBeTrue();
    });

    it('should pre-populate form with user data', () => {
      expect(component.form.get('full_name')?.value).toBe('John Doe');
      expect(component.form.get('username')?.value).toBe('johndoe');
      expect(component.form.get('email')?.value).toBe('john@example.com');
    });

    it('should not require password in edit mode', () => {
      expect(component.form.get('password')?.hasValidator(Validators.required)).toBeFalse();
    });

    it('should call UserService.update on valid submit', () => {
      component.form.patchValue({ full_name: 'Updated Name' });

      component.onSubmit();

      expect(userService.update).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ full_name: 'Updated Name' }),
      );
    });

    it('should map server validation errors to form controls', () => {
      const validationErr = new HttpErrorResponse({
        error: {
          statusCode: 422,
          error: {
            type: 'VALIDATION_ERROR',
            description: 'Validation failed',
            errors: { username: ['Username already taken'] },
          },
        },
        status: 422,
      });
      userService.update.and.returnValue(throwError(() => validationErr));

      component.form.patchValue({ full_name: 'Test' });
      component.onSubmit();

      expect(errorHandler.handleFormSubmitError).toHaveBeenCalledWith(
        validationErr,
        component.form,
        component.serverErrors,
      );
    });
  });
});
