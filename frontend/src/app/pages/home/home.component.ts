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
import { environment } from '../../../environments/environment';
import { ListingService, Listing } from '../../services/listing.service';
import { Loader } from '@googlemaps/js-api-loader';

declare const google: any;

interface Property extends Listing {
  image: string; // First image from images array for convenience
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
  isFilterPanelOpen = false;
  isListViewOpen = false;
  selectedProperty: Property | null = null;

  properties: Property[] = [];
  filteredProperties: Property[] = [];
  propertyTypes = ['All Types', 'House', 'Condo', 'Studio', 'Townhouse', 'Apartment'];

  constructor(private fb: FormBuilder, private listingService: ListingService) {
    this.filterForm = this.fb.group({
      searchQuery: [''],
      propertyType: ['All Types'],
      minPrice: [0],
      maxPrice: [2000000],
      bedrooms: [0],
      bathrooms: [0],
      minArea: [0],
      maxArea: [5000]
    });
  }

  ngOnInit() {
    this.loadGoogleMaps();
    this.setupFilterSubscription();
    this.fetchListings();
  }

  fetchListings() {
    this.listingService.getListings().subscribe(listings => {
      this.properties = listings.map(l => ({
        ...l,
        lat: l.lat ? Number(l.lat) : 0,
        lng: l.lng ? Number(l.lng) : 0,
        image: Array.isArray(l.images) && l.images.length > 0 
          ? l.images[0] 
          : 'https://via.placeholder.com/400'
      }));
      this.filteredProperties = [...this.properties];
      this.addPropertyMarkers();
    });
  }
  
  loadGoogleMaps() {
    const loader = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      this.initializeMap();
    }).catch(err => {
      console.error("Error loading Google Maps", err);
    });
  }

  initializeMap() {
    const mapOptions = {
      center: { lat: 40.7589, lng: -73.9851 },
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
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                  $${Math.round(property.price / 1000)}K
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

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters() {
    const filters = this.filterForm.value;
    this.filteredProperties = this.properties.filter(property => {
      if (filters.searchQuery && !property.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
          !property.address.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      if (filters.propertyType && filters.propertyType !== 'All Types' && property.type !== filters.propertyType) return false;
      if (property.price < filters.minPrice || property.price > filters.maxPrice) return false;
      if (filters.bedrooms > 0 && (property.bedrooms ?? 0) < filters.bedrooms) return false;
      if (filters.bathrooms > 0 && (property.bathrooms ?? 0) < filters.bathrooms) return false;
      if ((property.area ?? 0) < filters.minArea || (property.area ?? 0) > filters.maxArea) return false;
      return true;
    });
    this.addPropertyMarkers();
  }

  toggleFilterPanel() { this.isFilterPanelOpen = !this.isFilterPanelOpen; }
  toggleListView() { this.isListViewOpen = !this.isListViewOpen; }

  selectProperty(property: Property) {
    this.selectedProperty = property;
    if (property.lat && property.lng) {
      this.map.setCenter({ lat: property.lat, lng: property.lng });
      this.map.setZoom(15);
    }
  }

  resetFilters() {
    this.filterForm.reset({
      searchQuery: '',
      propertyType: 'All Types',
      minPrice: 0,
      maxPrice: 2000000,
      bedrooms: 0,
      bathrooms: 0,
      minArea: 0,
      maxArea: 5000
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  }

  closePropertyDetails() { this.selectedProperty = null; }
}