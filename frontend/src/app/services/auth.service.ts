import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://127.0.0.1:8000/api'; // Laravel backend URL

  constructor(private http: HttpClient) {}

  // Register a new user
  register(data: { name: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // Login and save token
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  // Logout and clear token
  logout(): void {
    localStorage.removeItem('token');
  }

  // Get logged-in user info
  getUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
