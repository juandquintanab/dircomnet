import { useState } from 'react';

/* ───────── Icon ───────── */
const PATHS = {
  search:          <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  plus:            <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  edit:            <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash:           <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
  filter:          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  'chevron-down':  <polyline points="6 9 12 15 18 9" />,
  'chevron-right': <polyline points="9 18 15 12 9 6" />,
  x:               <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  list:            <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  user:            <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  users:           <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  building:        <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /></>,
  bar:             <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>,
  grid:            <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  bell:            <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  settings:        <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  'arrow-up':      <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>,
  'arrow-down':    <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>,
  check:           <polyline points="20 6 9 17 4 12" />,
  logout:          <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  external:        <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  more:            <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  file:            <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
  radio:           <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></>,
  sparkles:        <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />,
};

export function Icon({ name, size = 16, color = 'currentColor' }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pl-icon"
    >
      {path}
    </svg>
  );
}

/* ───────── EmptyDash ───────── */
export function EmptyDash() {
  return <span className="pl-empty">—</span>;
}

/* ───────── Button ───────── */
export function Button({ variant = 'secondary', size = 'm', icon, children, onClick, type = 'button', disabled }) {
  return (
    <button
      className={`pl-btn pl-btn--${variant} pl-btn--${size}${disabled ? ' is-disabled' : ''}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={size === 's' ? 14 : 16} />}
      {children}
    </button>
  );
}

/* ───────── Chip ───────── */
export function Chip({ tone = 'blue', children, removable, onRemove }) {
  return (
    <span className={`pl-chip pl-chip--${tone}`}>
      {children}
      {removable && (
        <button className="pl-chip__x" onClick={onRemove} aria-label="Quitar">
          <Icon name="x" size={11} />
        </button>
      )}
    </span>
  );
}

export function CountChip({ children }) {
  return <span className="pl-chip pl-chip--count">{children}</span>;
}

/* ───────── Field / Input / Select ───────── */
export function Field({ label, children, hint, error }) {
  return (
    <label className="pl-field">
      {label && <span className="label-field">{label}</span>}
      {children}
      {(hint || error) && (
        <span className={`pl-field__hint${error ? ' is-error' : ''}`}>{error || hint}</span>
      )}
    </label>
  );
}

export function Input({ value, onChange, placeholder, error, disabled, leadingIcon }) {
  return (
    <div className={`pl-input${error ? ' is-error' : ''}${disabled ? ' is-disabled' : ''}`}>
      {leadingIcon && <Icon name={leadingIcon} size={16} />}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export function Select({ value, options = [], onChange, placeholder = 'Todos' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pl-select${open ? ' is-open' : ''}`}>
      <button type="button" className="pl-select__btn" onClick={() => setOpen((o) => !o)}>
        <span className={value ? '' : 'pl-select__ph'}>{value || placeholder}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div className="pl-select__menu">
          <button className="pl-select__opt" onClick={() => { onChange?.(''); setOpen(false); }}>
            {placeholder}
          </button>
          {options.map((o) => (
            <button key={o} className="pl-select__opt" onClick={() => { onChange?.(o); setOpen(false); }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Card / Section ───────── */
export function Card({ children, padding = 24, className = '' }) {
  return (
    <div className={`pl-card${className ? ` ${className}` : ''}`} style={{ padding }}>
      {children}
    </div>
  );
}

export function Section({ title, icon, children, action }) {
  return (
    <section className="pl-section">
      <header className="pl-section__head">
        <div className="pl-section__title">
          {icon && <Icon name={icon} size={14} />}
          <span className="label-section">{title}</span>
        </div>
        {action}
      </header>
      <div className="pl-section__body">{children}</div>
    </section>
  );
}
