<?php

namespace App\Http\Requests;

use App\Concerns\EntryCategoryRules;
use App\Models\Entry;
use App\Rules\ReadableHeifPhoto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEntryRequest extends FormRequest
{
    use EntryCategoryRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Entry $entry */
        $entry = $this->route('entry');

        return $this->user()->can('update', $entry);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Entry $entry */
        $entry = $this->route('entry');

        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'title' => ['nullable', 'string', 'max:120'],
            'location_place' => ['nullable', 'string', 'max:120'],
            'location_city' => ['nullable', 'string', 'max:120'],
            'location_state' => ['nullable', 'string', 'max:60'],
            'body' => ['nullable', 'string', 'max:10000'],
            'images' => ['nullable', 'array', 'max:'.max(0, 10 - $entry->images()->count())],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,heic,heif', 'max:15360', new ReadableHeifPhoto],
            'fingerprints' => ['nullable', 'array'],
            'fingerprints.*' => ['nullable', 'string', 'max:100'],
            'taken_keys' => ['nullable', 'array'],
            'taken_keys.*' => ['nullable', 'string', 'max:40'],
            'taken_times' => ['nullable', 'array'],
            'taken_times.*' => ['nullable', 'string', 'max:40'],
            'cover' => ['nullable', 'string', 'regex:/^(image|upload):\d+$/'],
            ...$this->categoryRules(),
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'images.max' => 'An entry can hold up to 10 images.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->categoryAttributeNames();
    }
}
