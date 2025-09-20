import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ListingService, Listing } from '../../services/listing.service';
import { Loader } from '@googlemaps/js-api-loader';
import { AuthService } from '../../services/auth.service';
import { LikeService } from '../../services/like.service';

declare const google: any;

interface Property extends Listing {
  image: string; 
  images?: string[];  
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatChipsModule,
    MatCardModule,
    MatBadgeModule,
    MatMenuModule,
    MatBottomSheetModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  map: any;
  markers: any[] = [];
  filterForm: FormGroup;
  isFilterPanelOpen = true; 
  isListViewOpen = true; 
  showEmail = false;
  showPhone = false;
  currentImageIndex: number = 0;
  galleryDirection: 'horizontal' | 'vertical' = 'horizontal';
  likedListings: Set<number> = new Set();
  selectedProperty: Property | null = null;

  properties: Property[] = [];
  filteredProperties: Property[] = [];
  propertyTypes = ['All Types', 'House', 'Condo', 'Studio', 'Townhouse', 'Apartment'];

  constructor(
    public authService: AuthService,
    private fb: FormBuilder, 
    private listingService: ListingService,
    private likeService: LikeService, 
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      searchQuery: [''],
      propertyType: ['All Types'],
      minPrice: [null],
      maxPrice: [null],
      bedrooms: [0],
      bathrooms: [0],
      minArea: [null],
      maxArea: [null]
    });
  }

  ngOnInit() {
    this.setupFilterSubscription();
    this.fetchListings();
    if (window.innerWidth <= 968) {
      this.isFilterPanelOpen = false;
      this.isListViewOpen = false;
    }
    if (this.authService.isLoggedIn()) {
      this.loadLikedListings();
    }
  }

  fetchListings() {
    this.listingService.getListings().subscribe(listings => {
      this.properties = listings.map(l => ({
        ...l,
        lat: l.lat ? Number(l.lat) : 0,
        lng: l.lng ? Number(l.lng) : 0,
        price: l.price ? l.price / 1000000 : 0,
        area: l.area || 0,
        image: Array.isArray(l.images) && l.images.length > 0 
          ? l.images[0] 
          : 'https://via.placeholder.com/400'
      }));
      this.filteredProperties = [...this.properties];
      this.addPropertyMarkers();
    });
  }
  
  loadGoogleMaps() {
    if (typeof google !== 'undefined') {
      this.initializeMap();
      return;
    }

    const loader = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      this.initializeMap();
    }).catch(err => {
      console.error("Error loading Google Maps", err);
      // Retry after delay
      setTimeout(() => this.loadGoogleMaps(), 1000);
    });
  }

  initializeMap() {
    const mapOptions = {
      center: { lat: 47.956967, lng: 21.715700 },
      zoom: 13,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    this.addPropertyMarkers();
  }

  addPropertyMarkers() {
    if (typeof google === 'undefined' || !this.map) {
      return; 
    }
    this.clearMarkers();
    this.filteredProperties.forEach(property => {
      if (property.lat && property.lng) {
        const marker = new google.maps.Marker({
          position: { lat: property.lat, lng: property.lng },
          map: this.map,
          title: property.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#667eea" stroke="white" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
                  ${property.price.toFixed(1)}M
                </text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40)
          }
        });
        marker.addListener('click', () => this.selectProperty(property));
        this.markers.push(marker);
      }
    });
  }

  nextImage() {
  if (this.selectedProperty && this.selectedProperty.images) {
    this.currentImageIndex = 
      (this.currentImageIndex + 1) % this.selectedProperty.images.length;
    }
  }

  prevImage() {
    if (this.selectedProperty && this.selectedProperty.images) {
      this.currentImageIndex = 
        (this.currentImageIndex - 1 + this.selectedProperty.images.length) % 
        this.selectedProperty.images.length;
    }
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  logout() {
    this.authService.logout().subscribe({
      error: () => {
        localStorage.removeItem('token');
      }
    });
  }

   toggleLike(property: Property, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    const wasLiked = this.likedListings.has(property.id);
    
    if (wasLiked) {
      this.likedListings.delete(property.id);
    } else {
      this.likedListings.add(property.id);
    }
    
    this.likeService.toggleLike(property.id).subscribe({
      error: (error) => {
        console.error('Error toggling like:', error);
        if (wasLiked) {
          this.likedListings.add(property.id);
        } else {
          this.likedListings.delete(property.id);
        }
      }
    });
  }

  isLiked(propertyId: number): boolean {
    return this.likedListings.has(propertyId);
  }

  loadLikedListings() {
    this.likeService.getLikedListings().subscribe({
      next: (listings) => {
        this.likedListings = new Set(listings.map(l => l.id));
      },
      error: (error) => {
        console.error('Error loading liked listings:', error);
      }
    });
  }

  ngAfterViewInit() {
  this.loadGoogleMaps();
  setTimeout(() => {
    if (typeof google !== 'undefined' && !this.map) {
      this.initializeMap();
      }
    }, 200);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    this.filteredProperties = this.properties.filter(property => {
      // Search query filter
      if (filters.searchQuery && 
          !property.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) && 
          !property.address.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }

      // Property type filter
      if (filters.propertyType && filters.propertyType !== 'All Types' && property.type !== filters.propertyType) {
        return false;
      }

      // Price filters 
      if (filters.minPrice !== null && property.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && property.price > filters.maxPrice) return false;

      // Bedrooms filter
      if (filters.bedrooms > 0 && (property.bedrooms ?? 0) < filters.bedrooms) return false;

      // Bathrooms filter
      if (filters.bathrooms > 0 && (property.bathrooms ?? 0) < filters.bathrooms) return false;

      // Area filters 
      if (filters.minArea !== null && (property.area ?? 0) < filters.minArea) return false;
      if (filters.maxArea !== null && (property.area ?? 0) > filters.maxArea) return false;

      return true;
    });

    this.addPropertyMarkers();
  }

  revealEmail() {
    this.showEmail = !this.showEmail;
    this.showPhone = false;
  }

  revealPhone() {
    this.showPhone = !this.showPhone;
    this.showEmail = false;
  }

  toggleFilterPanel() { 
    this.isFilterPanelOpen = !this.isFilterPanelOpen; 
  }

  toggleListView() { 
    this.isListViewOpen = !this.isListViewOpen; 
  }

  selectProperty(property: Property) {
    this.selectedProperty = property;
    this.currentImageIndex = 0;
    if (property.lat && property.lng) {
      this.map.setCenter({ lat: property.lat, lng: property.lng });
      this.map.setZoom(16);
    }
  }

  resetFilters() {
    this.filterForm.reset({
      searchQuery: '',
      propertyType: 'All Types',
      minPrice: null,
      maxPrice: null,
      bedrooms: 0,
      bathrooms: 0,
      minArea: null,
      maxArea: null
    });
  }

  formatPrice(price: number): string {
    return `${price.toFixed(2)} million HUF`;
  }

  formatArea(area: number): string {
    return `${area} m²`;
  }

  closePropertyDetails() { 
    this.selectedProperty = null; 
    this.showEmail = false;
    this.showPhone = false;
    this.currentImageIndex = 0;
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToListProperty() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/list']);
    } else {
      this.router.navigate(['/login']);
    }
  }

}