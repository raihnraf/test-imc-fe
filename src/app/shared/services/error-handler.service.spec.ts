import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorHandlerService } from './error-handler.service';

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
});
