import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ListingService, Listing } from '../../services/listing.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';  
import { MatInputModule } from '@angular/material/input'; 
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';
import { RouterModule } from '@angular/router';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '../assets/leaflet/marker-icon-2x.png',
  iconUrl: '../assets/leaflet/marker-icon.png',
  shadowUrl: '../assets/leaflet/marker-shadow.png'
});

@Component({
  selector: 'app-listings',
  standalone: true, 
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,  
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatCardModule,    
    CommonModule,  
    RouterModule,       
  ],
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss']
})
export class ListingsComponent implements OnInit, AfterViewInit {
  listingForm: FormGroup;
  isLoading = false;
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  maxImages = 10;
  
  private map!: L.Map;
  private marker!: L.Marker;

  propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'studio', label: 'Studio' }
  ];

  constructor(
    private fb: FormBuilder,
    private listingService: ListingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient 
  ) {
    this.listingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      type: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      area: ['', [Validators.required, Validators.min(1)]],
      bedrooms: ['', [Validators.min(0), Validators.max(20)]],
      bathrooms: ['', [Validators.min(0), Validators.max(20)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.pattern(/^\+?\d{10,15}$/)]],
      email: ['', [Validators.email]],
      lat: [null, Validators.required],
      lng: [null, Validators.required] 
    });
  }
  

  ngOnInit(): void {
    const address$ = this.listingForm.get('address')!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    );

    const city$ = this.listingForm.get('city')!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    );

    // ✅ Combine address + city
    combineLatest([address$, city$]).subscribe(([address, city]) => {
      this.tryGeocode(address, city);
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

 private initMap(): void {
    this.map = L.map('map').setView([47.956967, 21.715700], 13); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng.lat, e.latlng.lng);
    });
  }

  private setMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker.getLatLng();
        this.updateCoordinates(pos.lat, pos.lng);
      });
    }
    this.map.setView([lat, lng], 15);
    this.updateCoordinates(lat, lng);
  }

  private updateCoordinates(lat: number, lng: number): void {
    this.listingForm.patchValue({ lat, lng });
  }

  private tryGeocode(address?: string, city?: string): void {
    if (!address && !city) return;

    const query = `${address || ''} ${city || ''}`.trim();
    if (!query) return;

    this.http
      .get<any[]>(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json',
          limit: '1'
        }
      })
      .subscribe((results) => {
        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          this.setMarker(lat, lng);
        }
      });
  }

  onImageSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    if (this.selectedImages.length + files.length > this.maxImages) {
      this.snackBar.open(`You can upload maximum ${this.maxImages} images`, 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.selectedImages.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.listingForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field?.hasError('min')) {
      return `${this.getFieldDisplayName(fieldName)} must be greater than ${field.errors?.['min'].min - 1}`;
    }
    if (field?.hasError('max')) {
      return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors?.['max'].max}`;
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    if (field?.hasError('maxlength')) {
      return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors?.['maxlength'].requiredLength} characters`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('pattern')) {
      return 'Please enter a valid phone number (10-15 digits)';
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'title': 'Title',
      'description': 'Description',
      'type': 'Property Type',
      'price': 'Price',
      'area': 'Area',
      'bedrooms': 'Bedrooms',
      'bathrooms': 'Bathrooms',
      'address': 'Address',
      'city': 'City',
      'phoneNumber': 'Phone Number',
      'email': 'Email'
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.listingForm.valid) {
      this.isLoading = true;
      
      const formData = this.listingForm.value;

      if (formData.price) formData.price = Number(formData.price) * 1000000;
      if (formData.area) formData.area = Number(formData.area);
      if (formData.bedrooms) formData.bedrooms = Number(formData.bedrooms);
      if (formData.bathrooms) formData.bathrooms = Number(formData.bathrooms);

      if (this.selectedImages.length > 0) {
        formData.images = this.imagePreviewUrls; 
      }

      this.listingService.createListing(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Property listed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creating listing:', error);
          this.snackBar.open('Failed to create listing. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      Object.keys(this.listingForm.controls).forEach(key => {
        this.listingForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}