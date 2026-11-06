"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";

export type PropertyOption = {
  p_id: string;
  p_code: string | null;
  p_name: string | null;
  p_no: string | null;
  p_location: string | null;
  post_code: string | null;
  r_id: number;
  tenant?: string | null;
  tenant_phone?: string | null;
  tenant_email?: string | null;
  landlord?: string | null;
  landlord_phone?: string | null;
  landlord_email?: string | null;
  key_no?: string | null;
  p_type?: string | null;
  gas?: string | null;
  pir?: string | null;
  lra?: string | null;
  pat?: string | null;
  reg?: string | null;
  n_code?: string | null;
  d_code?: string | null;
  sl_no?: number;
};

export function propertyLabel(property: PropertyOption): string {
  return [property.p_code || property.p_no, property.p_name].filter(Boolean).join(" · ");
}

export function PropertyPicker({
  name,
  value,
  initialProperty,
  onSelect,
  placeholder = "Type property code or name...",
  required,
  disabled,
  autoFocus,
}: {
  name?: string;
  value?: string;
  initialProperty?: PropertyOption | null;
  onSelect?: (property: PropertyOption | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(initialProperty ? propertyLabel(initialProperty) : "");
  const [options, setOptions] = useState<PropertyOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState<PropertyOption | null>(initialProperty ?? null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFetch = useRef(false);

  useEffect(() => {
    if (initialProperty && (value === undefined || initialProperty.p_id === value)) {
      setSelected(initialProperty);
      setText(propertyLabel(initialProperty));
    }
  }, [initialProperty, value]);

  useEffect(() => {
    if (!open || disabled) return;
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void search(text);
    }, 180);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, open, disabled]);

  async function search(query: string): Promise<PropertyOption[]> {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/lookups?type=properties&limit=15&q=${encodeURIComponent(query.trim())}`,
      );
      const data = (await res.json()) as { data?: PropertyOption[] };
      const rows = data.data ?? [];
      setOptions(rows);
      setHighlight(0);
      return rows;
    } catch {
      setOptions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }

  function choose(property: PropertyOption) {
    skipFetch.current = true;
    setSelected(property);
    setText(propertyLabel(property));
    setOpen(false);
    onSelect?.(property);
  }

  async function resolve(query: string) {
    const rows = options.length && !query.trim() ? options : await search(query);
    const needle = query.trim().toLowerCase();
    const exact = rows.find(
      (row) =>
        String(row.p_code ?? "").toLowerCase() === needle ||
        String(row.p_no ?? "").toLowerCase() === needle ||
        String(row.p_id ?? "").toLowerCase() === needle,
    );
    const chosen = exact || rows[0];
    if (chosen) choose(chosen);
  }

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={selected?.p_id ?? ""} /> : null}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9 pr-9"
          value={text}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            setOpen(true);
            if (selected && next !== propertyLabel(selected)) {
              setSelected(null);
              onSelect?.(null);
            }
          }}
          onFocus={() => {
            setOpen(true);
            void search(text === (selected ? propertyLabel(selected) : "") ? "" : text);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 160);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setHighlight((current) => Math.min(current + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlight((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (open && options[highlight]) choose(options[highlight]);
              else void resolve(text);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {loading ? (
          <Loader2 className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : null}
        {text ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText("");
              setSelected(null);
              setOptions([]);
              onSelect?.(null);
              setOpen(true);
            }}
            aria-label="Clear property"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="mt-1 truncate text-[11px] text-slate-500">
          {[selected.p_no, selected.p_name, selected.p_location, selected.post_code]
            .filter(Boolean)
            .join(", ")}
        </div>
      ) : null}

      {open && !disabled ? (
        <div
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          onMouseDown={(event) => event.preventDefault()}
        >
          {options.map((property, index) => (
            <button
              key={property.p_id}
              type="button"
              className={[
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                index === highlight ? "bg-brand-50" : "hover:bg-slate-50",
              ].join(" ")}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => choose(property)}
            >
              <span className="mt-0.5 grid min-w-[62px] place-items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                {property.p_code || property.p_no || property.p_id}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-700">
                  {property.p_name || property.p_no || property.p_id}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {[property.p_no, property.p_location, property.post_code].filter(Boolean).join(", ")}
                </span>
              </span>
            </button>
          ))}
          {!loading && options.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              No property found. Press Enter to search again.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
