import { groupOf } from '../utils/fonts.js';

// Small font picker for generated content / blog posts. Shows the 5 fonts of
// the content's script; when the script has no webfont default (Latin), a
// "Default" entry restores the site's system stack.
export default function FontPicker({ script, value, onChange }) {
  const group = groupOf(script);
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
      Font
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-slate-200 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500"
        aria-label="Content font"
      >
        {group.defaultFont === null && <option value="">Default</option>}
        {group.fonts.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
    </label>
  );
}
