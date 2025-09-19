<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    protected $fillable = [
        'user_id', 'title', 'description', 'price', 'area', 'address', 'city',
        'images', 'type', 'bedrooms', 'bathrooms', 'lat', 'lng', 'phoneNumber', 'email'
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
