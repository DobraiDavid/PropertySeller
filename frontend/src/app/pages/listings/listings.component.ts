import { Component, OnInit } from '@angular/core';
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
  ],
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss']
})
export class ListingsComponent implements OnInit {
  listingForm: FormGroup;
  isLoading = false;
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  maxImages = 10;

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
    private snackBar: MatSnackBar
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
      email: ['', [Validators.email]]
    });
  }

  ngOnInit(): void {}

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

      if (formData.price) formData.price = Number(formData.price);
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