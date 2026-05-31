import { Injectable, inject } from '@angular/core';
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
