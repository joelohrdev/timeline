/**
 * Small illustrated icons for each category. Flat shapes on a 32×32 grid so they stay readable at 14–16px.
 * Colours are part of the drawing, so they ignore the surrounding text colour.
 */
import type { ComponentType } from 'react';

type IconProps = { className?: string };

function Icon({
    className,
    children,
}: IconProps & { children: React.ReactNode }) {
    return (
        <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            {children}
        </svg>
    );
}

export function PumpkinIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path
                d="M15 9.5c.2-2.6 1.2-4.4 3.4-5.6l1.4 1.6c-1.7.9-2.6 2.2-2.8 4.1z"
                fill="#5E7A2E"
            />
            <ellipse cx="10.5" cy="19" rx="7" ry="9" fill="#E8761F" />
            <ellipse cx="21.5" cy="19" rx="7" ry="9" fill="#E8761F" />
            <ellipse cx="16" cy="19" rx="6.5" ry="9.5" fill="#F59331" />
            <path d="M10 16.5l2.6-3 2.4 3z" fill="#3B1F0E" />
            <path d="M17 16.5l2.4-3 2.6 3z" fill="#3B1F0E" />
            <path
                d="M9.5 21c2 3.2 11 3.2 13 0l-1.6 3.2-1.7-1.5-1.6 1.7-1.6-1.7-1.6 1.7-1.7-1.5-1.6 1.5z"
                fill="#3B1F0E"
            />
        </Icon>
    );
}

export function CakeIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <rect
                x="3"
                y="26.5"
                width="26"
                height="2.5"
                rx="1.25"
                fill="#9AA6B8"
            />
            <rect x="6" y="15" width="20" height="12" rx="2.5" fill="#F48FB1" />
            <path
                d="M6 17.5c0-1.4 1.1-2.5 2.5-2.5h15c1.4 0 2.5 1.1 2.5 2.5v1.5c-1.2 0-1.6 1.8-3 1.8s-1.7-1.8-3-1.8-1.6 1.8-3 1.8-1.7-1.8-3-1.8-1.6 1.8-3 1.8-1.8-1.8-3-1.8z"
                fill="#FFF4E6"
            />
            <rect
                x="9.5"
                y="8.5"
                width="2"
                height="6.5"
                rx="1"
                fill="#5B8DEF"
            />
            <rect x="15" y="8.5" width="2" height="6.5" rx="1" fill="#FFC23D" />
            <rect
                x="20.5"
                y="8.5"
                width="2"
                height="6.5"
                rx="1"
                fill="#5B8DEF"
            />
            <path
                d="M10.5 3.5c1.4 1.6 1.6 3.4 0 4.3-1.6-.9-1.4-2.7 0-4.3z"
                fill="#FF8A1F"
            />
            <path
                d="M16 3.5c1.4 1.6 1.6 3.4 0 4.3-1.6-.9-1.4-2.7 0-4.3z"
                fill="#FF8A1F"
            />
            <path
                d="M21.5 3.5c1.4 1.6 1.6 3.4 0 4.3-1.6-.9-1.4-2.7 0-4.3z"
                fill="#FF8A1F"
            />
        </Icon>
    );
}

export function ChristmasTreeIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <rect x="13.5" y="25" width="5" height="5" rx="1" fill="#8B5A2B" />
            <path d="M16 13l11 13H5z" fill="#1F7A4D" />
            <path d="M16 8.5l8.5 10.5h-17z" fill="#26915B" />
            <path d="M16 4.5l6 7.5H10z" fill="#2FA96A" />
            <path
                d="M16 1l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z"
                fill="#FFC23D"
            />
            <circle cx="12" cy="17" r="1.5" fill="#E53E3E" />
            <circle cx="19.5" cy="15" r="1.5" fill="#FFC23D" />
            <circle cx="10" cy="23" r="1.5" fill="#FFC23D" />
            <circle cx="17" cy="21.5" r="1.5" fill="#E53E3E" />
            <circle cx="22.5" cy="23.5" r="1.5" fill="#E53E3E" />
        </Icon>
    );
}

export function BaseballIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <circle
                cx="16"
                cy="16"
                r="13"
                fill="#FFFFFF"
                stroke="#C9CED6"
                strokeWidth="1.5"
            />
            <path
                d="M8.2 5.6c3.6 2.8 5.4 6.4 5.4 10.4s-1.8 7.6-5.4 10.4M23.8 5.6c-3.6 2.8-5.4 6.4-5.4 10.4s1.8 7.6 5.4 10.4"
                fill="none"
                stroke="#E0413A"
                strokeWidth="1.6"
            />
            <path
                d="M8.8 7.1L12.0 8.5M23.2 7.1L20.0 8.5M10.7 9.9L13.9 11.3M21.3 9.9L18.1 11.3M11.7 12.9L14.9 14.3M20.3 12.9L17.1 14.3M11.7 17.7L14.9 19.1M20.3 17.7L17.1 19.1M10.7 20.7L13.9 22.1M21.3 20.7L18.1 22.1M8.8 23.5L12.0 24.9M23.2 23.5L20.0 24.9"
                stroke="#E0413A"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </Icon>
    );
}

export function TurkeyIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path d="M16 18L3.5 12.5A13 13 0 0 1 9 5z" fill="#D9472B" />
            <path d="M16 18L9 5a13 13 0 0 1 7-2z" fill="#F08A24" />
            <path d="M16 18V3a13 13 0 0 1 7 2z" fill="#F6B73C" />
            <path d="M16 18l7-13a13 13 0 0 1 5.5 7.5z" fill="#F08A24" />
            <path d="M16 18l12.5-5.5A13 13 0 0 1 29 17z" fill="#D9472B" />
            <path d="M16 18L3.5 12.5A13 13 0 0 0 3 17z" fill="#F6B73C" />
            <ellipse cx="16" cy="21" rx="7.5" ry="7" fill="#8A5530" />
            <circle cx="16" cy="13.5" r="4" fill="#A86B3C" />
            <circle cx="14.6" cy="12.8" r=".9" fill="#2B1A0E" />
            <circle cx="17.4" cy="12.8" r=".9" fill="#2B1A0E" />
            <path d="M14.8 14.6h2.4L16 16.4z" fill="#F6B73C" />
            <path
                d="M16.6 15.6c.9.4 1.2 1.6.4 2.6-.8-.5-1-1.6-.4-2.6z"
                fill="#D9472B"
            />
            <path
                d="M12.5 28l1-2.2M19.5 28l-1-2.2"
                stroke="#F08A24"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </Icon>
    );
}

export function HeartIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path
                d="M16 28C6.5 21.6 3 16.8 3 11.6 3 7.9 5.9 5 9.6 5c2.6 0 4.9 1.4 6.4 3.6C17.5 6.4 19.8 5 22.4 5 26.1 5 29 7.9 29 11.6c0 5.2-3.5 10-13 16.4z"
                fill="#E5244C"
            />
            <ellipse
                cx="9.5"
                cy="10.5"
                rx="2.4"
                ry="1.6"
                transform="rotate(-35 9.5 10.5)"
                fill="#FF8FA8"
            />
        </Icon>
    );
}

export function ShamrockIcon({ className }: IconProps) {
    const leaf =
        'M16 13.5C10.6 10.2 9.8 4.6 13.2 3.9c1.6-.3 2.5.9 2.8 2 .3-1.1 1.2-2.3 2.8-2 3.4.7 2.6 6.3-2.8 9.6z';

    return (
        <Icon className={className}>
            <path
                d="M16 13.5c.6 5 2.3 9.4 5.6 14"
                fill="none"
                stroke="#1E8A4C"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <g fill="#25A35A">
                <path d={leaf} />
                <path d={leaf} transform="rotate(120 16 13.5)" />
                <path d={leaf} transform="rotate(240 16 13.5)" />
            </g>
        </Icon>
    );
}

export function EasterEggIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path
                d="M16 3c5.2 0 10 8 10 15.2C26 24.6 21.6 29 16 29S6 24.6 6 18.2C6 11 10.8 3 16 3z"
                fill="#B9A6F5"
            />
            <path
                d="M6.3 15.5l3.2-2.8 3.2 2.8 3.3-2.8 3.3 2.8 3.2-2.8 3.2 2.8v3.8l-3.2-2.8-3.2 2.8-3.3-2.8-3.3 2.8-3.2-2.8-3.2 2.8z"
                fill="#FFD166"
            />
            <circle cx="11" cy="23" r="1.6" fill="#F48FB1" />
            <circle cx="16" cy="24.5" r="1.6" fill="#7FD1AE" />
            <circle cx="21" cy="23" r="1.6" fill="#F48FB1" />
            <circle cx="13" cy="8.5" r="1.3" fill="#7FD1AE" />
            <circle cx="19" cy="8.5" r="1.3" fill="#F48FB1" />
        </Icon>
    );
}

export function TulipIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path
                d="M16 15v14"
                stroke="#2E8B57"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M16 24c-5.5-.4-8.5-3.6-9-8 4.8.4 8 3 9 8z"
                fill="#3DAA6B"
            />
            <path
                d="M16 26c4.5-.8 7-3.4 7.5-6.8-4 .5-6.6 2.8-7.5 6.8z"
                fill="#3DAA6B"
            />
            <path
                d="M9 5.5l3.5 3L16 3l3.5 5.5 3.5-3v5.5C23 14.6 19.9 17 16 17s-7-2.4-7-6z"
                fill="#F0599A"
            />
            <path d="M16 3l3.5 5.5L16 17l-3.5-8.5z" fill="#F77DB4" />
        </Icon>
    );
}

export function NecktieIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path d="M11.5 3h9l-2 5.5h-5z" fill="#1F3A68" />
            <path d="M13.5 8.5h5l3.5 15-6 5.5-6-5.5z" fill="#2B4F8C" />
            <path
                d="M13 12.5l6.3-2.4.6 2.4-7.4 2.8zM12.1 17l8.5-3.2.6 2.5-9.8 3.7zM11.8 21.4l9.8-3.7.5 2.3-9.6 3.6z"
                fill="#FFC23D"
            />
        </Icon>
    );
}

export function FlagIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <rect x="4" y="3" width="2" height="27" rx="1" fill="#8A93A3" />
            <rect
                x="6"
                y="5"
                width="22"
                height="15"
                fill="#FFFFFF"
                stroke="#D5DAE1"
                strokeWidth=".6"
            />
            <path
                d="M6 5h22v2.2H6zM6 9.4h22v2.1H6zM6 13.7h22v2.1H6zM6 17.9h22V20H6z"
                fill="#D9363E"
            />
            <rect x="6" y="5" width="10" height="8.6" fill="#2D4C8F" />
            <g fill="#FFFFFF">
                <circle cx="8.3" cy="7" r=".7" />
                <circle cx="11" cy="7" r=".7" />
                <circle cx="13.7" cy="7" r=".7" />
                <circle cx="9.6" cy="9.3" r=".7" />
                <circle cx="12.3" cy="9.3" r=".7" />
                <circle cx="8.3" cy="11.6" r=".7" />
                <circle cx="11" cy="11.6" r=".7" />
                <circle cx="13.7" cy="11.6" r=".7" />
            </g>
        </Icon>
    );
}

export function FireworksIcon({ className }: IconProps) {
    const rays = Array.from({ length: 12 }, (_, index) => {
        const angle = (index * Math.PI) / 6;
        const inner = 4.5;
        const outer = index % 2 === 0 ? 13 : 10.5;

        return {
            x1: 16 + Math.cos(angle) * inner,
            y1: 16 + Math.sin(angle) * inner,
            x2: 16 + Math.cos(angle) * outer,
            y2: 16 + Math.sin(angle) * outer,
            color: ['#E5363E', '#2F5BD3', '#FFC23D'][index % 3],
        };
    });

    return (
        <Icon className={className}>
            {rays.map((ray, index) => (
                <line
                    key={index}
                    {...ray}
                    stroke={ray.color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />
            ))}
            <circle cx="16" cy="16" r="2.6" fill="#FFC23D" />
        </Icon>
    );
}

export function BurgerIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path d="M4 14c0-5.5 5.4-9 12-9s12 3.5 12 9z" fill="#E9A23B" />
            <g fill="#FFF3D6">
                <ellipse cx="11" cy="9" rx=".9" ry=".5" />
                <ellipse cx="16" cy="7.6" rx=".9" ry=".5" />
                <ellipse cx="21" cy="9" rx=".9" ry=".5" />
                <ellipse cx="13.5" cy="11.4" rx=".9" ry=".5" />
                <ellipse cx="18.5" cy="11.4" rx=".9" ry=".5" />
            </g>
            <path
                d="M3.5 15.5h25l-2 2.4-2.3-1.6-2.3 1.6-2.3-1.6-2.3 1.6-2.3-1.6-2.3 1.6-2.3-1.6-2.3 1.6-2.3-1.6z"
                fill="#4CAF50"
            />
            <rect
                x="3.5"
                y="17.5"
                width="25"
                height="4"
                rx="2"
                fill="#6B3A1F"
            />
            <path
                d="M4 22.5h24v1.2C28 26.6 25.4 28 22 28H10c-3.4 0-6-1.4-6-4.3z"
                fill="#E9A23B"
            />
        </Icon>
    );
}

export function PartyPopperIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path d="M3 29l6.5-17.5 11 11z" fill="#7B5CD6" />
            <path
                d="M6.2 20.5l5.3 5.3-3.2 1.2-3.3-3.3zM8.3 14.7l9 9-3.1 1.2-7.1-7.1z"
                fill="#FFC23D"
            />
            <path
                d="M13 9.5c1-2.8 3.4-4 6-3M22.5 19c2.8-1 4-3.4 3-6"
                fill="none"
                stroke="#F0599A"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <rect
                x="19.5"
                y="3"
                width="2.6"
                height="2.6"
                rx=".6"
                transform="rotate(20 20.8 4.3)"
                fill="#2FB0E0"
            />
            <rect
                x="26"
                y="7.5"
                width="2.6"
                height="2.6"
                rx=".6"
                transform="rotate(-15 27.3 8.8)"
                fill="#FFC23D"
            />
            <rect
                x="25.5"
                y="21.5"
                width="2.6"
                height="2.6"
                rx=".6"
                transform="rotate(30 26.8 22.8)"
                fill="#E5363E"
            />
            <circle cx="24" cy="4.5" r="1.2" fill="#E5363E" />
            <circle cx="28.5" cy="15" r="1.2" fill="#2FB0E0" />
            <circle cx="15" cy="4" r="1.2" fill="#3DAA6B" />
        </Icon>
    );
}

export function SunriseIcon({ className }: IconProps) {
    return (
        <Icon className={className}>
            <path d="M7 21a9 9 0 0 1 18 0z" fill="#FFB52E" />
            <g stroke="#FFB52E" strokeWidth="2" strokeLinecap="round">
                <path d="M16 4.5v3.5M5.2 9.2l2.5 2.5M26.8 9.2l-2.5 2.5M2 18h3.5M26.5 18H30" />
            </g>
            <rect
                x="2"
                y="21"
                width="28"
                height="2.4"
                rx="1.2"
                fill="#F07B3F"
            />
            <rect
                x="6"
                y="25.5"
                width="20"
                height="2.2"
                rx="1.1"
                fill="#F7A86B"
            />
        </Icon>
    );
}

export const categoryIcons: Record<string, ComponentType<IconProps>> = {
    halloween: PumpkinIcon,
    birthday: CakeIcon,
    christmas: ChristmasTreeIcon,
    baseball_game: BaseballIcon,
    thanksgiving: TurkeyIcon,
    valentines_day: HeartIcon,
    st_patricks_day: ShamrockIcon,
    easter: EasterEggIcon,
    mothers_day: TulipIcon,
    fathers_day: NecktieIcon,
    memorial_day: FlagIcon,
    independence_day: FireworksIcon,
    labor_day: BurgerIcon,
    new_years_eve: PartyPopperIcon,
    new_years_day: SunriseIcon,
};
