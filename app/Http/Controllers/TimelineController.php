<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    /**
     * Show the public timeline, newest day first, loaded page by page as the visitor scrolls.
     */
    public function __invoke(): Response
    {
        return Inertia::render('timeline', [
            'entries' => Inertia::scroll(fn () => Entry::query()
                ->with('images')
                ->latest('date')
                ->paginate(40)),
        ]);
    }
}
