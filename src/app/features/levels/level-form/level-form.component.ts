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
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { LevelService } from '../../levels/level.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import type { LevelForm } from '../../../shared/models/user.model';

@Component({
  selector: 'app-level-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './level-form.component.html',
  styleUrls: ['./level-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelFormComponent implements OnInit {
  private readonly levelService = inject(LevelService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private readonly levelId = signal<number | null>(null);
  readonly isEditMode = computed(() => this.levelId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Edit Level' : 'Create Level'));
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly serverErrors = signal<Record<string, string[]>>({});

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    is_active: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.levelId.set(Number(id));
      this.loadLevel(Number(id));
    }
  }

  private loadLevel(id: number): void {
    this.isLoading.set(true);
    this.levelService.getById(id).subscribe({
      next: (level) => {
        this.form.patchValue({
          name: level.name,
          description: level.description,
          is_active: level.is_active,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorHandler.handle(err);
        this.router.navigate(['/admin/levels']);
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

    const rawValue = this.form.getRawValue() as LevelForm;
    const payload = {
      name: rawValue.name,
      description: rawValue.description || null,
      is_active: rawValue.is_active,
    };

    const request$ = this.isEditMode()
      ? this.levelService.update(this.levelId()!, payload)
      : this.levelService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Level updated successfully' : 'Level created successfully',
          'Close',
          { duration: 3000 },
        );
        this.router.navigate(['/admin/levels']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorHandler.handleFormSubmitError(err, this.form, this.serverErrors);
      },
    });
  }

  get nameControl() {
    return this.form.get('name');
  }
  get descriptionControl() {
    return this.form.get('description');
  }
}
