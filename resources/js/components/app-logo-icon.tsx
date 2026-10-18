import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="76 76 360 360"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect
                x="123"
                y="83"
                width="44"
                height="318"
                rx="22"
                fill="currentColor"
            />
            <rect
                x="123"
                y="357"
                width="210"
                height="44"
                rx="22"
                fill="currentColor"
            />
            <circle cx="145" cy="121" r="40" fill="#f97316" />
            <circle cx="145" cy="245" r="40" fill="#d946ef" />
            <circle cx="355" cy="379" r="52" fill="#22c55e" />
        </svg>
    );
}
