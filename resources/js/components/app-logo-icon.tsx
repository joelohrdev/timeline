import type { SVGAttributes } from 'react';

/**
 * The LohrLine mark: one continuous line that loops into a handwritten "ll" and runs on.
 * Drawn in the current text colour so it suits light and dark pages.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="34 38 440 440"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                transform="translate(-10 22)"
                d="M66 352 C 128 352, 182 318, 208 252 C 236 182, 240 100, 194 100 C 146 100, 146 200, 174 286 C 194 342, 240 372, 284 344 C 322 318, 360 236, 358 160 C 356 106, 322 98, 308 100 C 264 106, 266 200, 292 290 C 310 348, 350 368, 392 362 C 420 358, 442 346, 462 330"
                fill="none"
                stroke="currentColor"
                strokeWidth="40"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
