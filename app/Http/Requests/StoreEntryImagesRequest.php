<?php

namespace App\Http\Requests;

use App\Models\Entry;
use App\Rules\ReadableHeifPhoto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEntryImagesRequest extends FormRequest
{
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
            'images' => ['required', 'array', 'min:1', 'max:'.max(0, 10 - $entry->images()->count())],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,heic,heif', 'max:15360', new ReadableHeifPhoto],
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
            'images.required' => 'Choose at least one photo to add.',
            'images.max' => 'An entry can hold up to 10 images.',
        ];
    }
}
