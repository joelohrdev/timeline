<?php

namespace App\Http\Controllers;

use App\EntryCategory;
use App\Models\Entry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    /**
     * Show the public timeline, newest day first (events within a day in the order they were posted), loaded page by page as the visitor scrolls.
     *
     * With ?date=YYYY-MM-DD the timeline starts at that day's month and continues back from there.
     * With ?category=… it shows only entries in that category. Unknown values are ignored.
     */
    public function __invoke(Request $request): Response
    {
        $jumpedTo = $this->requestedDate($request);
        $category = $request->enum('category', EntryCategory::class);

        return Inertia::render('timeline', [
            'entries' => Inertia::scroll(fn () => Entry::query()
                ->with('images')
                ->when($jumpedTo, fn ($query) => $query->whereDate('date', '<=', $jumpedTo->copy()->endOfMonth()))
                ->when($category, fn ($query) => $query->where('category', $category))
                ->latest('date')
                ->oldest('id')
                ->paginate(40)),
            'jumpedTo' => $jumpedTo?->toDateString(),
            'category' => $category?->value,
            'categories' => EntryCategory::options(),
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
