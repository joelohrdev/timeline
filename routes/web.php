<?php

use App\Http\Controllers\EntryController;
use App\Http\Controllers\EntryImageController;
use App\Http\Controllers\TimelineController;
use Illuminate\Support\Facades\Route;

Route::get('/', TimelineController::class)->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('dashboard', '/')->name('dashboard');

    Route::resource('entries', EntryController::class)->except(['index', 'show']);

    Route::post('entries/{entry}/images', [EntryImageController::class, 'store'])
        ->name('entries.images.store');

    Route::delete('entries/{entry}/images/{image}', [EntryImageController::class, 'destroy'])
        ->scopeBindings()
        ->name('entries.images.destroy');
});

require __DIR__.'/settings.php';
