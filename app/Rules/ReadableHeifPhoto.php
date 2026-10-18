<?php

namespace App\Rules;

use App\Actions\StoreEntryImage;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Rejects HEIC/HEIF photos up front when this server has no decoder for them.
 */
class ReadableHeifPhoto implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $storeEntryImage = app(StoreEntryImage::class);

        if ($value instanceof UploadedFile && $storeEntryImage->isHeif($value) && ! $storeEntryImage->canReadHeif()) {
            $fail("This server can't read HEIC photos yet. Choose them as JPEG instead.");
        }
    }
}
