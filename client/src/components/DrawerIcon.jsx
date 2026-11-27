// Drawer toggle icon: three lines + a right chevron, signalling a side
// panel that slides out (a drawer), not a plain dropdown menu.
// Same 24x24 stroke style as the Feather icons used elsewhere.
export default function DrawerIcon({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="3" y1="6" x2="15" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="15" y2="18" />
      <polyline points="17 8 21 12 17 16" />
    </svg>
  );
}
