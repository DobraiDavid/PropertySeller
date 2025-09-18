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

declare const google: any;

interface Property {
  id: number;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  image: string;
  lat: number;
  lng: number;
  address: string;
  isNew: boolean;
  hasVirtualTour: boolean;
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
  
  // Sample properties data
  properties: Property[] = [
    {
      id: 1,
      title: 'Modern Downtown Condo',
      price: 750000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      type: 'Condo',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      lat: 40.7589,
      lng: -73.9851,
      address: '123 Park Ave, New York, NY',
      isNew: true,
      hasVirtualTour: true
    },
    {
      id: 2,
      title: 'Luxury Family House',
      price: 1200000,
      bedrooms: 4,
      bathrooms: 3,
      area: 2500,
      type: 'House',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      lat: 40.7505,
      lng: -73.9934,
      address: '456 Madison St, New York, NY',
      isNew: false,
      hasVirtualTour: false
    },
    {
      id: 3,
      title: 'Cozy Studio Apartment',
      price: 450000,
      bedrooms: 1,
      bathrooms: 1,
      area: 600,
      type: 'Studio',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      lat: 40.7614,
      lng: -73.9776,
      address: '789 Broadway, New York, NY',
      isNew: false,
      hasVirtualTour: true
    }
  ];

  filteredProperties: Property[] = [];

  propertyTypes = ['All Types', 'House', 'Condo', 'Studio', 'Townhouse', 'Apartment'];
  
  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      searchQuery: [''],
      propertyType: ['All Types'],
      minPrice: [0],
      maxPrice: [2000000],
      bedrooms: [0],
      bathrooms: [0],
      minArea: [0],
      maxArea: [5000],
      hasVirtualTour: [false],
      newListings: [false]
    });

    this.filteredProperties = [...this.properties];
  }

  ngOnInit() {
    this.loadGoogleMaps();
    this.setupFilterSubscription();
  }



  loadGoogleMaps() {
    if (typeof google !== 'undefined') {
      this.initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`
    script.onload = () => this.initializeMap();
    document.head.appendChild(script);
  }

  initializeMap() {
    const mapOptions = {
      center: { lat: 40.7589, lng: -73.9851 },
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    this.addPropertyMarkers();
  }

  addPropertyMarkers() {
    this.clearMarkers();
    
    this.filteredProperties.forEach(property => {
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

      marker.addListener('click', () => {
        this.selectProperty(property);
      });

      this.markers.push(marker);
    });
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    this.filteredProperties = this.properties.filter(property => {
      // Search query filter
      if (filters.searchQuery && !property.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
          !property.address.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }

      // Property type filter
      if (filters.propertyType && filters.propertyType !== 'All Types' && property.type !== filters.propertyType) {
        return false;
      }

      // Price range filter
      if (property.price < filters.minPrice || property.price > filters.maxPrice) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms > 0 && property.bedrooms < filters.bedrooms) {
        return false;
      }

      // Bathrooms filter
      if (filters.bathrooms > 0 && property.bathrooms < filters.bathrooms) {
        return false;
      }

      // Area filter
      if (property.area < filters.minArea || property.area > filters.maxArea) {
        return false;
      }

      // Virtual tour filter
      if (filters.hasVirtualTour && !property.hasVirtualTour) {
        return false;
      }

      // New listings filter
      if (filters.newListings && !property.isNew) {
        return false;
      }

      return true;
    });

    this.addPropertyMarkers();
  }

  toggleFilterPanel() {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }

  toggleListView() {
    this.isListViewOpen = !this.isListViewOpen;
  }

  selectProperty(property: Property) {
    this.selectedProperty = property;
    this.map.setCenter({ lat: property.lat, lng: property.lng });
    this.map.setZoom(15);
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
      maxArea: 5000,
      hasVirtualTour: false,
      newListings: false
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  closePropertyDetails() {
    this.selectedProperty = null;
  }
}