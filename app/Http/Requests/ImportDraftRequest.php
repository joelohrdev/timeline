<?php

namespace App\Http\Requests;

use App\Rules\ReadableHeifPhoto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportDraftRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'entry_id' => ['nullable', 'integer', Rule::exists('entries', 'id')->where('user_id', $this->user()->id)],
            'date' => ['required', 'date_format:Y-m-d'],
            'title' => ['nullable', 'string', 'max:120'],
            'location_place' => ['nullable', 'string', 'max:120'],
            'location_city' => ['nullable', 'string', 'max:120'],
            'location_state' => ['nullable', 'string', 'max:60'],
            'body' => ['nullable', 'string', 'max:10000'],
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,heic,heif', 'max:15360', new ReadableHeifPhoto],
            'fingerprints' => ['nullable', 'array'],
            'fingerprints.*' => ['nullable', 'string', 'max:100'],
            'taken_keys' => ['nullable', 'array'],
            'taken_keys.*' => ['nullable', 'string', 'max:40'],
            'taken_times' => ['nullable', 'array'],
            'taken_times.*' => ['nullable', 'string', 'max:40'],
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
            'entry_id.exists' => 'That event no longer exists.',
            'images.max' => 'An event can hold up to 10 photos.',
        ];
    }
}
