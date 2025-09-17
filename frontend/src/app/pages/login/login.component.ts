import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = ''; // reset error

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Login successful, navigate to a home page
        this.router.navigate(['/']); 
      },
      error: (err) => {
        // Display the error message
        this.error = err.error?.email || 'Login failed';
      },
    });
  }
}
