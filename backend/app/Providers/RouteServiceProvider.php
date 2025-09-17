<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * This is the path to your “home” route, used by Laravel authentication, etc.
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, etc.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            // → All routes defined in routes/api.php will be prefixed with “/api”
            Route::middleware('api')
                 ->prefix('api')
                 ->group(base_path('routes/api.php'));

            // → All routes defined in routes/web.php will be loaded under the “web” middleware
            Route::middleware('web')
                 ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            // Default: max 60 requests per minute for API routes
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
