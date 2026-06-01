import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorHandlerService } from './error-handler.service';
import { FormGroup, FormControl } from '@angular/forms';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [ErrorHandlerService, { provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should open MatSnackBar with error description from ApiErrorResponse', () => {
    const err = new HttpErrorResponse({
      error: {
        statusCode: 422,
        error: {
          type: 'VALIDATION_ERROR',
          description: 'Username is required',
        },
      },
      status: 422,
    });

    service.handle(err);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Username is required',
      'Close',
      jasmine.objectContaining({ duration: 5000 }),
    );
  });

  it('should show fallback message for non-structured HttpErrorResponse', () => {
    const err = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

    service.handle(err);

    expect(snackBar.open).toHaveBeenCalledWith(
      'An unexpected error occurred',
      'Close',
      jasmine.objectContaining({ duration: 5000 }),
    );
  });

  it('should show fallback message for unknown errors', () => {
    service.handle('some string error');
    expect(snackBar.open).toHaveBeenCalledWith(
      'An unexpected error occurred',
      'Close',
      jasmine.any(Object),
    );
  });

  it('should extract form errors from validation error response', () => {
    const err = new HttpErrorResponse({
      error: {
        statusCode: 422,
        error: {
          type: 'VALIDATION_ERROR',
          description: 'Validation failed',
          errors: { username: ['Username is required'], email: ['Invalid email'] },
        },
      },
      status: 422,
    });

    const result = service.handleFormErrors(err);
    expect(result).toEqual({ username: ['Username is required'], email: ['Invalid email'] });
  });

  it('should return empty object for non-validation errors', () => {
    const err = new HttpErrorResponse({
      error: { statusCode: 500, error: { type: 'SERVER_ERROR', description: 'Error' } },
      status: 500,
    });

    const result = service.handleFormErrors(err);
    expect(result).toEqual({});
  });

  describe('handleFormSubmitError', () => {
    let form: FormGroup;
    let serverErrors: { value: Record<string, string[]>; set: (v: Record<string, string[]>) => void };

    beforeEach(() => {
      form = new FormGroup({
        username: new FormControl(''),
        email: new FormControl(''),
        name: new FormControl(''),
      });
      serverErrors = {
        value: {},
        set(v) { this.value = v; },
      };
    });

    it('should map validation errors to form controls and serverErrors signal', () => {
      const err = new HttpErrorResponse({
        error: {
          statusCode: 422,
          error: {
            type: 'VALIDATION_ERROR',
            description: 'Validation failed',
            errors: { username: ['Username already taken'], email: ['Invalid email'] },
          },
        },
        status: 422,
      });

      service.handleFormSubmitError(err, form, serverErrors);

      expect(form.get('username')?.errors).toEqual({ server: ['Username already taken'] });
      expect(form.get('email')?.errors).toEqual({ server: ['Invalid email'] });
      expect(serverErrors.value).toEqual({
        username: ['Username already taken'],
        email: ['Invalid email'],
      });
    });

    it('should map single field error to form control and serverErrors signal', () => {
      const err = new HttpErrorResponse({
        error: {
          statusCode: 409,
          error: {
            type: 'CONFLICT_ERROR',
            description: 'Duplicate',
            field: 'username',
          },
        },
        status: 409,
      });

      service.handleFormSubmitError(err, form, serverErrors);

      expect(form.get('username')?.errors).toEqual({ server: ['Duplicate'] });
      expect(serverErrors.value).toEqual({ username: ['Duplicate'] });
    });

    it('should call handle() for non-validation/non-conflict errors', () => {
      const err = new HttpErrorResponse({
        error: { statusCode: 500, error: { type: 'SERVER_ERROR', description: 'Internal error' } },
        status: 500,
      });

      service.handleFormSubmitError(err, form, serverErrors);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Internal error',
        'Close',
        jasmine.objectContaining({ duration: 5000 }),
      );
      expect(serverErrors.value).toEqual({});
    });

    it('should call handle() for non-HttpErrorResponse errors', () => {
      service.handleFormSubmitError('some error', form, serverErrors);

      expect(snackBar.open).toHaveBeenCalledWith(
        'An unexpected error occurred',
        'Close',
        jasmine.any(Object),
      );
    });

    it('should not set errors for non-existent form controls', () => {
      const err = new HttpErrorResponse({
        error: {
          statusCode: 422,
          error: {
            type: 'VALIDATION_ERROR',
            description: 'Validation failed',
            errors: { nonexistent_field: ['Not found'] },
          },
        },
        status: 422,
      });

      service.handleFormSubmitError(err, form, serverErrors);

      expect(serverErrors.value).toEqual({ nonexistent_field: ['Not found'] });
    });
  });
});
