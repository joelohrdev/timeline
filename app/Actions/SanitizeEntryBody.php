<?php

namespace App\Actions;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

class SanitizeEntryBody
{
    /**
     * Reduce editor HTML to the formatting the editor toolbar offers, so it is safe to render on the public timeline.
     */
    public function handle(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $config = (new HtmlSanitizerConfig)
            ->allowElement('p')
            ->allowElement('br')
            ->allowElement('strong')
            ->allowElement('em')
            ->allowElement('ul')
            ->allowElement('ol')
            ->allowElement('li')
            ->allowElement('blockquote')
            ->allowElement('a', ['href'])
            ->allowLinkSchemes(['http', 'https', 'mailto'])
            ->forceAttribute('a', 'rel', 'noopener noreferrer nofollow')
            ->forceAttribute('a', 'target', '_blank')
            ->withMaxInputLength(50000);

        $sanitized = trim((new HtmlSanitizer($config))->sanitize($html));

        return trim(strip_tags($sanitized)) === '' ? null : $sanitized;
    }
}
