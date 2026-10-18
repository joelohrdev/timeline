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

/**
 * POST multipart form data (with files) to the app and report the outcome, including validation messages.
 */
export async function postForm(
    url: string,
    data: FormData,
): Promise<{ ok: boolean; message: string | null }> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            body: data,
        });

        if (response.ok) {
            return { ok: true, message: null };
        }

        const body = (await response.json().catch(() => null)) as {
            message?: string;
            errors?: Record<string, string[]>;
        } | null;
        const firstError = body?.errors
            ? Object.values(body.errors)[0]?.[0]
            : undefined;

        return {
            ok: false,
            message:
                response.status === 413
                    ? 'These photos are too large to upload together.'
                    : (firstError ??
                      body?.message ??
                      "Couldn't post this day."),
        };
    } catch {
        return { ok: false, message: "Couldn't reach the server. Try again." };
    }
}
