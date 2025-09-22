import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Listing } from './listing.service';

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  private apiUrl = 'https://estatehub-w37i.onrender.com/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Toggle like/unlike a listing
  toggleLike(listingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/listings/${listingId}/like`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all listings liked by the logged-in user
  getLikedListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.apiUrl}/users/liked-listings`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get the number of users who liked a listing
  getLikesCount(listingId: number): Observable<{ likes: number }> {
    return this.http.get<{ likes: number }>(`${this.apiUrl}/listings/${listingId}/likes-count`, {
      headers: this.getAuthHeaders()
    });
  }
}
