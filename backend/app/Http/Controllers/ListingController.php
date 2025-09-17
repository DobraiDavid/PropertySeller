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
        $listing = Listing::create($request->all());
        return response()->json($listing, 201);
    }

    public function show($id)
    {
        return Listing::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $listing = Listing::findOrFail($id);
        $listing->update($request->all());
        return response()->json($listing);
    }

    public function destroy($id)
    {
        Listing::destroy($id);
        return response()->json(null, 204);
    }
}
