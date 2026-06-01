import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { ApiErrorResponse } from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private readonly snackBar = inject(MatSnackBar);

  handle(error: HttpErrorResponse | unknown): void {
    const message = this.getErrorMessage(error);
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar',
    });
  }

  handleFormErrors(error: HttpErrorResponse): Record<string, string[]> {
    const apiError = error?.error as ApiErrorResponse | undefined;
    return apiError?.error?.errors ?? {};
  }

  handleFormSubmitError(
    error: unknown,
    form: FormGroup,
    serverErrors: { set: (value: Record<string, string[]>) => void },
  ): void {
    if (error instanceof HttpErrorResponse) {
      const apiError = error?.error as ApiErrorResponse | undefined;

      if ((error.status === 422 || error.status === 409) && apiError?.error) {
        if (apiError.error.errors) {
          const formErrors = this.handleFormErrors(error);
          for (const [field, messages] of Object.entries(formErrors)) {
            const control = form.get(field);
            if (control) {
              control.setErrors({ server: messages });
            }
          }
          serverErrors.set(formErrors);
        }

        if (apiError.error.field && apiError.error.description) {
          const control = form.get(apiError.error.field);
          if (control) {
            control.setErrors({ server: [apiError.error.description] });
            serverErrors.set({
              [apiError.error.field]: [apiError.error.description],
            });
          }
        }
      } else {
        this.handle(error);
      }
    } else {
      this.handle(error);
    }
  }

  getErrorMessage(error: HttpErrorResponse | unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error?.error as ApiErrorResponse | undefined;
      if (apiError?.error?.description) {
        return apiError.error.description;
      }
      return 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
  }
}
