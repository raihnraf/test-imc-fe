import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { UserService } from '../../users/user.service';
import { LevelService } from '../../levels/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import type { Level, UpdateUserRequest } from '../../../shared/models/user.model';

interface UserFormControls {
  full_name: FormControl<string>;
  username: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  level_id: FormControl<number | null>;
  is_active: FormControl<boolean>;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private readonly userId = signal<number | null>(null);
  readonly isEditMode = computed(() => this.userId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Edit User' : 'Create User'));
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly levels = signal<Level[]>([]);
  readonly serverErrors = signal<Record<string, string[]>>({});
  hidePassword = true;

  readonly form: FormGroup<UserFormControls> = this.fb.group({
    full_name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    username: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/),
    ]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(100)]),
    password: this.fb.nonNullable.control('', [Validators.minLength(6)]),
    level_id: this.fb.nonNullable.control<number | null>(null),
    is_active: this.fb.nonNullable.control(true),
  });

  ngOnInit(): void {
    this.loadLevels();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(Number(id));
      this.loadUser(Number(id));
    }
    if (!this.isEditMode()) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  private loadLevels(): void {
    this.levelService.list({ perPage: 100 }).subscribe({
      next: (response) => this.levels.set(response.data),
      error: (err) => this.errorHandler.handle(err),
    });
  }

  private loadUser(id: number): void {
    this.isLoading.set(true);
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          level_id: user.level_id,
          is_active: user.is_active,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorHandler.handle(err);
        this.router.navigate(['/admin/users']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverErrors.set({});

    const rawValue = this.form.getRawValue();

    if (this.isEditMode()) {
      const payload: UpdateUserRequest = {
        full_name: rawValue.full_name,
        username: rawValue.username,
        email: rawValue.email,
        level_id: rawValue.level_id,
        is_active: rawValue.is_active,
      };

      if (rawValue.password) {
        payload.password = rawValue.password;
      }

      this.userService.update(this.userId()!, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/users']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorHandler.handleFormSubmitError(err, this.form, this.serverErrors);
        },
      });
    } else {
      this.userService.create({
        full_name: rawValue.full_name,
        username: rawValue.username,
        email: rawValue.email,
        password: rawValue.password,
        level_id: rawValue.level_id,
        is_active: rawValue.is_active,
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/users']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorHandler.handleFormSubmitError(err, this.form, this.serverErrors);
        },
      });
    }
  }

  get fullNameControl(): FormControl<string> {
    return this.form.controls.full_name;
  }
  get usernameControl(): FormControl<string> {
    return this.form.controls.username;
  }
  get emailControl(): FormControl<string> {
    return this.form.controls.email;
  }
  get passwordControl(): FormControl<string> {
    return this.form.controls.password;
  }
}
