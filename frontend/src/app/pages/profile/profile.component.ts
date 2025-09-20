import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { ListingService, Listing } from '../../services/listing.service';
import { LikeService } from '../../services/like.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <div mat-dialog-content>
        <p>{{ data.message }}</p>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button 
          [color]="data.confirmColor || 'primary'" 
          (click)="onConfirm()"
          class="confirm-button"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 16px;
    }
    .confirm-button {
      margin-left: 8px;
    }
    [mat-dialog-content] p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatInputModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: any = {};
  userListings: Listing[] = [];
  likedListings: Listing[] = [];
  isEditingProfile = false;
  isLoading = false;
  activeTab = 'profile';
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  
  // Stats
  totalListings = 0;
  totalLikes = 0;
  totalViews = 0;

  // For likes display
  listingLikes: { [key: number]: number } = {};
  likesLoading: { [key: number]: boolean } = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private listingService: ListingService,
    private likeService: LikeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadUserListings();
    this.loadLikedListings();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadUserData() {
    this.authService.getUser().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email
        });
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.showSnackBar('Failed to load user data', 'error-snackbar');
      }
    });
  }

  loadUserListings() {
    this.listingService.getListings().subscribe({
      next: (listings) => {
        this.userListings = listings.filter(listing => listing.user_id === this.user.id);
        this.totalListings = this.userListings.length;
        this.loadLikesForAllListings();
        this.calculateTotalLikes();
      },
      error: (error) => {
        console.error('Error loading user listings:', error);
      }
    });
  }

  loadLikedListings() {
    this.likeService.getLikedListings().subscribe({
      next: (listings) => {
        this.likedListings = listings;
      },
      error: (error) => {
        console.error('Error loading liked listings:', error);
      }
    });
  }

  loadLikesForAllListings() {
    this.userListings.forEach(listing => {
      this.likesLoading[listing.id] = true;
      this.likeService.getLikesCount(listing.id).subscribe({
        next: (response) => {
          this.listingLikes[listing.id] = response.likes;
          this.likesLoading[listing.id] = false;
        },
        error: (error) => {
          console.error('Error loading likes for listing:', listing.id, error);
          this.listingLikes[listing.id] = 0;
          this.likesLoading[listing.id] = false;
        }
      });
    });
  }

  calculateTotalLikes() {
    let totalLikes = 0;
    this.userListings.forEach(listing => {
      this.likeService.getLikesCount(listing.id).subscribe({
        next: (response) => {
          totalLikes += response.likes;
          this.totalLikes = totalLikes;
        }
      });
    });
  }

  onTabChange(index: number) {
    this.activeTab = index === 0 ? 'profile' :
                     index === 1 ? 'security' : 'other';
  }

  onEditProfile() {
    this.isEditingProfile = true;
  }

  onCancelEdit() {
    this.isEditingProfile = false;
    this.profileForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }

  onSaveProfile() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    const formData = this.profileForm.value;

    // Prepare payload for backend
    const payload: any = {
      name: formData.name,
      email: formData.email
    };

    if (formData.newPassword) {
      payload.password = formData.newPassword;
      payload.password_confirmation = formData.confirmPassword;
      payload.current_password = formData.currentPassword; 
    }

    // Call the auth service to update user profile
    this.authService.updateProfile(payload).subscribe({
      next: (response) => {
        this.user.name = response.user.name;
        this.user.email = response.user.email;
        this.isEditingProfile = false;
        this.isLoading = false;
        this.showSnackBar('Profile updated successfully!', 'success-snackbar');

        // Clear password fields
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isLoading = false;
        this.showSnackBar('Failed to update profile', 'error-snackbar');
      }
    });
  }

  onDeleteListing(listing: Listing) {
    this.openDeleteConfirmation(listing);
  }

  private openDeleteConfirmation(listing: Listing): void {
    const dialogConfig = {
      width: '400px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteListing(listing);
      }
    });
  }

  private deleteListing(listing: Listing) {
    this.listingService.deleteListing(listing.id).subscribe({
      next: () => {
        this.userListings = this.userListings.filter(l => l.id !== listing.id);
        this.totalListings = this.userListings.length;
        this.showSnackBar('Listing deleted successfully!', 'success-snackbar');
      },
      error: (error) => {
        console.error('Error deleting listing:', error);
        this.showSnackBar('Failed to delete listing', 'error-snackbar');
      }
    });
  }

  onToggleLike(listing: Listing) {
    this.likeService.toggleLike(listing.id).subscribe({
      next: () => {
        // Remove from liked listings if unliked
        this.likedListings = this.likedListings.filter(l => l.id !== listing.id);
        this.showSnackBar('Removed from favorites', 'success-snackbar');
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        this.showSnackBar('Failed to update favorites', 'error-snackbar');
      }
    });
  }

  onEditListing(listingId: number) {
    this.router.navigate(['/edit-listing', listingId]);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onViewListing(listingId: number) {
    this.router.navigate(['/'], {
      state: { selectedPropertyId: listingId }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.profileForm.get(field);
    if (control?.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${requiredLength} characters`;
    }
    if (field === 'confirmPassword' && this.profileForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(field => {
      const control = this.profileForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  private showSnackBar(message: string, panelClass: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
        this.showSnackBar('Logged out successfully', 'success-snackbar');
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/']);
      }
    });
  }
}