<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CheckPhotosRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'photos' => ['required', 'array', 'max:50'],
            'photos.*.fingerprint' => ['nullable', 'string', 'max:100'],
            'photos.*.taken_key' => ['nullable', 'string', 'max:40'],
        ];
    }
}
