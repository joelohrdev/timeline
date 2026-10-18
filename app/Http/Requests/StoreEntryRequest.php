<?php

namespace App\Http\Requests;

use App\Concerns\EntryCategoryRules;
use App\Rules\ReadableHeifPhoto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEntryRequest extends FormRequest
{
    use EntryCategoryRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'title' => ['nullable', 'string', 'max:120'],
            'location_place' => ['nullable', 'string', 'max:120'],
            'location_city' => ['nullable', 'string', 'max:120'],
            'location_state' => ['nullable', 'string', 'max:60'],
            'body' => ['nullable', 'string', 'max:10000'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,heic,heif', 'max:15360', new ReadableHeifPhoto],
            'fingerprints' => ['nullable', 'array'],
            'fingerprints.*' => ['nullable', 'string', 'max:100'],
            'taken_keys' => ['nullable', 'array'],
            'taken_keys.*' => ['nullable', 'string', 'max:40'],
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
