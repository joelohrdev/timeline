<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    /**
     * Show the public timeline, newest day first, loaded page by page as the visitor scrolls.
     *
     * With ?date=YYYY-MM-DD the timeline starts at that day's month and continues back from there.
     */
    public function __invoke(Request $request): Response
    {
        $jumpedTo = $this->requestedDate($request);

        return Inertia::render('timeline', [
            'entries' => Inertia::scroll(fn () => Entry::query()
                ->with('images')
                ->when($jumpedTo, fn ($query) => $query->whereDate('date', '<=', $jumpedTo->copy()->endOfMonth()))
                ->latest('date')
                ->paginate(40)),
            'jumpedTo' => $jumpedTo?->toDateString(),
            'firstDate' => fn (): ?string => Entry::query()->min('date'),
        ]);
    }

    /**
     * The day being searched for, or null when none (or an invalid one) was given.
     */
    private function requestedDate(Request $request): ?Carbon
    {
        $validator = Validator::make($request->only('date'), [
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        if ($validator->fails() || ! $request->filled('date')) {
            return null;
        }

        return Carbon::createFromFormat('!Y-m-d', $request->string('date')->value());
    }
}
