import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

export interface Listing {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  price: number;
  area: number;
  address: string;
  city: string;
  images?: string[]; 
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  lat?: number;
  lng?: number;
  phoneNumber?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'https://estatehub-w37i.onrender.com/api/listings';

  constructor(private http: HttpClient) {}

  // Get all listings
  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.apiUrl);
  }

  // Get single listing
  getListing(id: number): Observable<Listing> {
    return this.http.get<Listing>(`${this.apiUrl}/${id}`);
  }

  // Create a new listing
  createListing(listing: Partial<Listing>): Observable<Listing> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  return this.http.post<Listing>(this.apiUrl, listing, { headers });
  }

  // Update a listing
  updateListing(id: number, listing: Partial<Listing>): Observable<Listing> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  return this.http.put<Listing>(`${this.apiUrl}/${id}`, listing, { headers });
  }

  // Delete a listing
  deleteListing(listingId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  return this.http.delete(`${this.apiUrl}/${listingId}`, { headers })
  }
}
