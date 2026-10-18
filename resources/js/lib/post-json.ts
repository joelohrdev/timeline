/**
 * Laravel's CSRF token from its XSRF-TOKEN cookie.
 */
function xsrfToken(): string {
    const match = /(?:^|; )XSRF-TOKEN=([^;]*)/.exec(document.cookie);

    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * POST JSON to the app and return the parsed response, or null if the request failed.
 * For small background lookups where a failure should never block the form.
 */
export async function postJson<T>(
    url: string,
    body: unknown,
): Promise<T | null> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            body: JSON.stringify(body),
        });

        return response.ok ? ((await response.json()) as T) : null;
    } catch {
        return null;
    }
}
