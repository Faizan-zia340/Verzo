// Drawer toggle icon: three lines + a chevron, signalling a side
// panel that slides out (a drawer), not a plain dropdown menu.
// Same 24x24 stroke style as the Feather icons used elsewhere.
// `direction` is the side the drawer lives on: "right" (default) puts
// the chevron on the right pointing right; "left" mirrors it — the
// chevron sits on the left pointing left, for a left-side drawer
// (e.g. the Admin sidebar).
export default function DrawerIcon({ size = 18, direction = 'right', ...props }) {
  const left = direction === 'left';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {left ? (
        <>
          <line x1="9" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="9" y1="18" x2="21" y2="18" />
          <polyline points="7 8 3 12 7 16" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="15" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="15" y2="18" />
          <polyline points="17 8 21 12 17 16" />
        </>
      )}
    </svg>
  );
}
