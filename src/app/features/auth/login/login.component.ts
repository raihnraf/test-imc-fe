import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import type { ApiErrorResponse } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);

  readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly isLoading = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly hidePassword = signal(true);

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.serverError.set(null);

    const { identifier, password } = this.loginForm.getRawValue();

    this.authService
      .login({ username: identifier, email: identifier, password })
      .pipe(
        switchMap((res) => {
          const userId = res.data.user.id;
          return this.permissionService.loadPermissions(userId);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => this.router.navigate(['/admin']),
        error: (err: HttpErrorResponse) => {
          const apiError = err.error as ApiErrorResponse;
          this.serverError.set(
            apiError?.error?.description ?? 'Login failed. Please try again.',
          );
        },
      });
  }
}
