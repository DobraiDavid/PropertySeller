<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function index()
    {
        return Listing::all();
    }

    public function store(Request $request)
        {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|string',
                'price' => 'required|numeric',
                'area' => 'required|numeric',
                'bedrooms' => 'nullable|integer',
                'bathrooms' => 'nullable|integer',
                'address' => 'required|string|max:255',
                'city' => 'required|string|max:255',
                'phoneNumber' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'images' => 'nullable|array',
                'lat' => 'numeric',
                'lng' => 'numeric',
            ]);

            $validated['user_id'] = auth()->id();

            $listing = Listing::create($validated);

            return response()->json($listing, 201);
        }

    public function show($id)
    {
        return Listing::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string',
            'price' => 'required|numeric',
            'area' => 'required|numeric',
            'bedrooms' => 'nullable|integer',
            'bathrooms' => 'nullable|integer',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'phoneNumber' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'images' => 'nullable|array',
            'lat' => 'numeric',
            'lng' => 'numeric',
        ]);

        $listing = Listing::findOrFail($id);
        $listing->update($validated);

        return response()->json($listing);
    }

    public function destroy($id)
    {
        Listing::destroy($id);
        return response()->json(null, 204);
    }
}
