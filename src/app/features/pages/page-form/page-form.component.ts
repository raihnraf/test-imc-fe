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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { PageService } from '../../pages/page.service';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';

interface PageFormControls {
  name: FormControl<string>;
  route_path: FormControl<string>;
  description: FormControl<string>;
  display_order: FormControl<number>;
  is_active: FormControl<boolean>;
}

@Component({
  selector: 'app-page-form',
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
  templateUrl: './page-form.component.html',
  styleUrls: ['./page-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormComponent implements OnInit {
  private readonly pageService = inject(PageService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private readonly pageId = signal<number | null>(null);
  readonly isEditMode = computed(() => this.pageId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Edit Page' : 'Create Page'));
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly serverErrors = signal<Record<string, string[]>>({});

  readonly form: FormGroup<PageFormControls> = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    route_path: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255), Validators.pattern(/^\/\S*$/)]),
    description: this.fb.nonNullable.control(''),
    display_order: this.fb.nonNullable.control(0, [Validators.min(0)]),
    is_active: this.fb.nonNullable.control(true),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pageId.set(Number(id));
      this.loadPage(Number(id));
    }
  }

  private loadPage(id: number): void {
    this.isLoading.set(true);
    this.pageService.getById(id).subscribe({
      next: (page) => {
        this.form.patchValue({
          name: page.name,
          route_path: page.route_path,
          description: page.description ?? '',
          display_order: page.display_order,
          is_active: page.is_active,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorHandler.handle(err);
        this.router.navigate(['/admin/pages']);
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
    const payload = {
      name: rawValue.name,
      route_path: rawValue.route_path,
      description: rawValue.description || null,
      display_order: rawValue.display_order,
      is_active: rawValue.is_active,
    };

    const request$ = this.isEditMode()
      ? this.pageService.update(this.pageId()!, payload)
      : this.pageService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Page updated successfully' : 'Page created successfully',
          'Close',
          { duration: 3000 },
        );
        this.router.navigate(['/admin/pages']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorHandler.handleFormSubmitError(err, this.form, this.serverErrors);
      },
    });
  }

  get nameControl(): FormControl<string> {
    return this.form.controls.name;
  }
  get routePathControl(): FormControl<string> {
    return this.form.controls.route_path;
  }
  get descriptionControl(): FormControl<string> {
    return this.form.controls.description;
  }
  get displayOrderControl(): FormControl<number> {
    return this.form.controls.display_order;
  }
}
