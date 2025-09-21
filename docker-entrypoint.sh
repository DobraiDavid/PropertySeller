#!/bin/bash
# Run Laravel migrations automatically
php artisan migrate --force

# Start Laravel server
php artisan serve --host=0.0.0.0 --port=8000
