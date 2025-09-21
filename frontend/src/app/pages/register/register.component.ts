import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (field?.hasError('minlength')) {
      if (fieldName === 'password') {
        return 'Password must be at least 8 characters long';
      }
      return `${fieldName} must be at least ${field.errors?.['minlength'].requiredLength} characters long`;
    }
    
    if (field?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const formValue = this.registerForm.value;

      this.authService.register(formValue).subscribe({
        next: () => {
          this.authService.login({
            email: formValue.email,
            password: formValue.password
          }).subscribe({
            next: () => {
              this.isLoading = false;
              this.toastr.success('Registration successful! You are now logged in.', 'Success');
              this.router.navigate(['/']); 
            },
            error: (loginErr) => {
              this.isLoading = false;
              this.toastr.error('Registration succeeded but login failed. Please log in manually.', 'Login Failed');
              console.error('Login failed after registration:', loginErr);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error('Registration failed. Please try again.', 'Error');
          console.error('Registration failed:', err);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}