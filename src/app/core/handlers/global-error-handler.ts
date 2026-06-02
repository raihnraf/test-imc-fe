import { ErrorHandler, Injectable, Injector, inject, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    console.error('[GlobalError]', error);

    const message = this.extractMessage(error);

    this.zone.run(() => {
      try {
        const snackBar = this.injector.get(MatSnackBar);
        snackBar.open(message, 'Dismiss', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      } catch {
        // MatSnackBar not yet available — fallback to alert
        alert(message);
      }
    });
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred';
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }
}
