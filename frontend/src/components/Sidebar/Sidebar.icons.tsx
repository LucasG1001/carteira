interface IconProps {
  className?: string;
}

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function InvestmentsIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 5-6" />
      <path d="M20 8v4h-4" />
    </Icon>
  );
}

export function ExpensesIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 3h12l4 4v14l-3-2-3 2-3-2-3 2-2-2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Icon>
  );
}

export function LogoIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-4a2 2 0 0 0 0 4h4" />
      <path d="M16 13h.01" />
    </Icon>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}
