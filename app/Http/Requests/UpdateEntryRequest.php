<?php

namespace App\Http\Requests;

use App\Concerns\EntryCategoryRules;
use App\Models\Entry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'date' => ['required', 'date_format:Y-m-d', Rule::unique('entries', 'date')->ignore($entry)],
            'body' => ['nullable', 'string', 'max:10000'],
            'images' => ['nullable', 'array', 'max:'.max(0, 10 - $entry->images()->count())],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:15360'],
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
            'date.unique' => 'There is already an entry for this day.',
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
