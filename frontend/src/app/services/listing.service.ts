import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'http://localhost:8000/api/listings';

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
    return this.http.post<Listing>(this.apiUrl, listing);
  }

  // Update a listing
  updateListing(id: number, listing: Partial<Listing>): Observable<Listing> {
    return this.http.put<Listing>(`${this.apiUrl}/${id}`, listing);
  }

  // Delete a listing
  deleteListing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
