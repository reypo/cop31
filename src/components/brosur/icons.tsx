/** Basit inline SVG sosyal simgeler (currentColor). */

import type { Social } from "@/lib/content";

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function XIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d="M5 4.5h4l10 15h-4z" {...stroke} strokeWidth={1.6} />
      <path d="M19 4.5l-5.6 6.4M10.6 13.1 5 19.5" {...stroke} />
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="4.8" {...stroke} />
      <circle cx="12" cy="12" r="3.7" {...stroke} />
      <circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d="M14.5 20v-7h2.6l.4-3h-3V8.4c0-.9.3-1.5 1.6-1.5h1.5V4.2c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4V10H9v3h2.5v7z" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d="M13.5 4v10.6a3.4 3.4 0 1 1-3.4-3.4" {...stroke} strokeWidth={2.1} />
      <path d="M13.5 4c.4 2.6 2.2 4.4 4.9 4.6" {...stroke} strokeWidth={2.1} />
    </svg>
  );
}

function WebIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M4 12h16M12 4c2.4 2.3 3.6 5 3.6 8s-1.2 5.7-3.6 8c-2.4-2.3-3.6-5-3.6-8S9.6 6.3 12 4z" {...stroke} strokeWidth={1.6} />
    </svg>
  );
}

export function SocialIcon({ name, className }: { name: Social["name"]; className?: string }) {
  switch (name) {
    case "X":
      return <XIcon className={className} />;
    case "Instagram":
      return <InstagramIcon className={className} />;
    case "Facebook":
      return <FacebookIcon className={className} />;
    case "TikTok":
      return <TikTokIcon className={className} />;
    default:
      return <WebIcon className={className} />;
  }
}
