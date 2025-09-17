import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html'
})

export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  password_confirmation = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.password_confirmation
    }).subscribe({
      next: (res) => console.log('Registered successfully:', res),
      error: (err) => console.error('Registration failed:', err)
    });
  }
}
