<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ListingLikeController extends Controller
{
    // Toggle like/unlike a listing
    public function toggle($id)
    {
        $user = Auth::user();
        $listing = Listing::findOrFail($id);

        $liked = $user->likedListings()->toggle($listing->id);

        return response()->json([
            'message' => $liked['attached'] ? 'Listing liked' : 'Listing unliked',
            'listing_id' => $listing->id,
            'liked' => (bool) count($liked['attached'])
        ]);
    }

    public function likedListings()
    {
        $user = Auth::user();
        $listings = $user->likedListings()->get();

        return response()->json($listings);
    }

    public function likeCount($id)
    {
        $listing = Listing::findOrFail($id);
        $count = $listing->likedByUsers()->count();

        return response()->json([
            'listing_id' => $listing->id,
            'likes' => $count
        ]);
    }
}
