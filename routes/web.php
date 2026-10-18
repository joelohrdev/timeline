<?php

use App\Http\Controllers\EntryController;
use App\Http\Controllers\EntryImageController;
use App\Http\Controllers\PhotoCheckController;
use App\Http\Controllers\PlaceLookupController;
use App\Http\Controllers\TimelineController;
use App\Http\Controllers\YearController;
use Illuminate\Support\Facades\Route;

Route::get('/', TimelineController::class)->name('home');
Route::get('years/{year}', YearController::class)->whereNumber('year')->name('years.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('dashboard', '/')->name('dashboard');

    Route::resource('entries', EntryController::class)->except(['index', 'show']);

    Route::post('places/lookup', PlaceLookupController::class)
        ->middleware('throttle:30,1')
        ->name('places.lookup');

    Route::post('photos/check', PhotoCheckController::class)
        ->middleware('throttle:60,1')
        ->name('photos.check');

    Route::post('entries/{entry}/images', [EntryImageController::class, 'store'])
        ->name('entries.images.store');

    Route::delete('entries/{entry}/images/{image}', [EntryImageController::class, 'destroy'])
        ->scopeBindings()
        ->name('entries.images.destroy');
});

require __DIR__.'/settings.php';
