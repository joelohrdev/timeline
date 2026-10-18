<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class EntryImageController extends Controller
{
    /**
     * Remove a single image from an entry.
     */
    public function destroy(Entry $entry, EntryImage $image): RedirectResponse
    {
        Gate::authorize('update', $entry);

        $image->delete();

        return back();
    }
}
