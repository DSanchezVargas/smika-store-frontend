import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean);
}

function MultiCreatableSelect({
  label,
  values = [],
  onChange,
  options = [],
  onCreate,
  placeholder = "Buscar o seleccionar",
  emptyLabel = "Sin selección",
  helperText = "",
  disabled = false,
  disabledText = "Selecciona primero un dato requerido.",
  createLabel,
  emptyCreateLabel = "Agregar nuevo",
  secondaryCreateLabel,
  onSecondaryCreate
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedValues = normalizeArray(values);
  const cleanSearch = search.trim();

  const selectedSet = useMemo(() => {
    return new Set(selectedValues.map((value) => value.toLowerCase()));
  }, [selectedValues]);

  const filteredOptions = useMemo(() => {
    const loweredSearch = cleanSearch.toLowerCase();

    return options.filter((option) => {
      const optionName = option.nombre || "";

      if (!optionName) return false;

      if (selectedSet.has(optionName.toLowerCase())) return false;

      if (!loweredSearch) return true;

      return optionName.toLowerCase().includes(loweredSearch);
    });
  }, [options, cleanSearch, selectedSet]);

  const exactExists = options.some(
    (option) => option.nombre?.toLowerCase() === cleanSearch.toLowerCase()
  );

  const selectedExactExists = selectedValues.some(
    (value) => value.toLowerCase() === cleanSearch.toLowerCase()
  );

  const canCreate = cleanSearch && !exactExists && !selectedExactExists && !disabled;

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  const toggleMenu = () => {
    if (disabled) return;
    setOpen((current) => !current);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const addValue = (value) => {
    if (!value) return;

    const alreadySelected = selectedValues.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    if (alreadySelected) return;

    onChange([...selectedValues, value]);
    setSearch("");
  };

  const removeValue = (value) => {
    onChange(selectedValues.filter((item) => item !== value));
  };

  const clearValues = () => {
    onChange([]);
    closeMenu();
  };

  const handleCreate = () => {
    if (!canCreate) return;

    const createdOption = onCreate(cleanSearch);

    if (createdOption?.nombre) {
      addValue(createdOption.nombre);
    } else {
      addValue(cleanSearch);
    }

    closeMenu();
  };

  const handleSecondaryCreate = () => {
    if (!canCreate || !onSecondaryCreate) return;

    const createdOption = onSecondaryCreate(cleanSearch);

    if (createdOption?.nombre) {
      addValue(createdOption.nombre);
    } else {
      addValue(cleanSearch);
    }

    closeMenu();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="grid gap-2 text-sm font-bold">
        {label}

        <button
          type="button"
          disabled={disabled}
          onClick={toggleMenu}
          className={`min-h-[58px] rounded-2xl border px-4 py-3 text-left outline-none flex items-center justify-between gap-3 ${
            disabled
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              : open
              ? "border-[#87CCC8] bg-white"
              : "border-gray-200 bg-white"
          }`}
        >
          <span className="flex flex-wrap gap-2">
            {disabled ? (
              <span className="text-gray-400">{disabledText}</span>
            ) : selectedValues.length > 0 ? (
              selectedValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black text-[#2F2F2F]"
                >
                  {value}

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removeValue(value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        removeValue(value);
                      }
                    }}
                    className="rounded-full bg-white/70 p-0.5"
                  >
                    <X size={12} />
                  </span>
                </span>
              ))
            ) : (
              <span className="text-gray-400">{emptyLabel}</span>
            )}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      </label>

      {helperText && (
        <p className="mt-2 text-xs text-gray-500 leading-5">{helperText}</p>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[86px] z-40 rounded-3xl border border-[#87CCC8]/20 bg-white smika-shadow p-3">
          <div className="flex items-center gap-2 rounded-2xl bg-[#F8F6F7] px-3 py-2">
            <Search size={17} className="text-gray-500" />

            <input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              placeholder={placeholder}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          <div className="mt-3 max-h-60 overflow-y-auto grid gap-1">
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={clearValues}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-[#F8F6F7]"
              >
                {emptyLabel}
                <Check size={17} className="text-[#87CCC8]" />
              </button>
            )}

            {filteredOptions.map((option) => (
              <button
                key={option.id || option.nombre}
                type="button"
                onClick={() => addValue(option.nombre)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-[#F8F6F7]"
              >
                <span>
                  {option.nombre}

                  {option.serie && (
                    <span className="ml-2 text-xs text-gray-400">
                      {option.serie}
                    </span>
                  )}

                  {option.needsReview && (
                    <span className="ml-2 rounded-full bg-[#F7D9D8] px-2 py-1 text-[10px] font-black">
                      Faltan detalles
                    </span>
                  )}
                </span>

                <Plus size={17} className="text-[#87CCC8]" />
              </button>
            ))}

            {!cleanSearch && filteredOptions.length === 0 && (
              <div className="rounded-2xl bg-[#F8F6F7] px-4 py-3 text-sm font-bold text-gray-500">
                No hay más personajes disponibles para seleccionar.
              </div>
            )}

            {!cleanSearch && (
              <button
                type="button"
                onClick={focusInput}
                className="mt-2 flex items-center gap-2 rounded-2xl bg-[#F7D9D8] px-4 py-3 text-left text-sm font-black"
              >
                <Plus size={17} />
                {emptyCreateLabel}
              </button>
            )}

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-2 flex items-center gap-2 rounded-2xl bg-[#87CCC8] px-4 py-3 text-left text-sm font-black text-white"
              >
                <Plus size={17} />
                {createLabel ? createLabel(cleanSearch) : `Agregar “${cleanSearch}”`}
              </button>
            )}

            {canCreate && onSecondaryCreate && (
              <button
                type="button"
                onClick={handleSecondaryCreate}
                className="flex items-center gap-2 rounded-2xl bg-[#F7D9D8] px-4 py-3 text-left text-sm font-black"
              >
                <Plus size={17} />
                {secondaryCreateLabel
                  ? secondaryCreateLabel(cleanSearch)
                  : `Agregar personaje “${cleanSearch}”`}
              </button>
            )}

            {cleanSearch && (exactExists || selectedExactExists) && (
              <div className="mt-2 rounded-2xl bg-[#F8F6F7] px-4 py-3 text-sm font-bold text-gray-500">
                Ese personaje ya existe o ya fue seleccionado.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={closeMenu}
            className="mt-3 w-full rounded-2xl bg-[#F7D9D8] px-4 py-2 text-sm font-black"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default MultiCreatableSelect;