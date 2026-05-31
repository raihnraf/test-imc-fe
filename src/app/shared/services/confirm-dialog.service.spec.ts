import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [ConfirmDialogService, { provide: MatDialog, useValue: dialog }],
    });

    service = TestBed.inject(ConfirmDialogService);
  });

  it('should open MatDialog with title and message', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);

    service.confirm({ title: 'Delete', message: 'Are you sure?' }).subscribe((result) => {
      expect(result).toBeTrue();
    });

    expect(dialog.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          title: 'Delete',
          message: 'Are you sure?',
        }),
      }),
    );
  });

  it('should return false when dialog is cancelled', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(false) } as any);

    service.confirm({ title: 'Test', message: 'Test' }).subscribe((result) => {
      expect(result).toBeFalse();
    });
  });

  it('should return false when dialog is dismissed (null result)', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);

    service.confirm({ title: 'Test', message: 'Test' }).subscribe((result) => {
      expect(result).toBeFalse();
    });
  });
});
