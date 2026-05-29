import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";

function CreatableSelect({
  label,
  value,
  onChange,
  options,
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

  const cleanSearch = search.trim();

  const selectedOption = options.find((option) => option.nombre === value);

  const filteredOptions = useMemo(() => {
    const loweredSearch = cleanSearch.toLowerCase();

    if (!loweredSearch) return options;

    return options.filter((option) =>
      option.nombre.toLowerCase().includes(loweredSearch)
    );
  }, [options, cleanSearch]);

  const exactExists = options.some(
    (option) => option.nombre.toLowerCase() === cleanSearch.toLowerCase()
  );

  const canCreate = cleanSearch && !exactExists && !disabled;

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  const toggleMenu = () => {
    if (disabled) return;

    setOpen((current) => !current);
  };

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    closeMenu();
  };

  const handleCreate = () => {
    if (!canCreate) return;

    const createdOption = onCreate(cleanSearch);

    if (createdOption) {
      onChange(createdOption.nombre);
    }

    closeMenu();
  };

  const handleSecondaryCreate = () => {
    if (!canCreate || !onSecondaryCreate) return;

    const createdOption = onSecondaryCreate(cleanSearch);

    if (createdOption) {
      onChange(createdOption.nombre);
    }

    closeMenu();
  };

  const focusInput = () => {
    inputRef.current?.focus();
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
          className={`min-h-[50px] rounded-2xl border px-4 py-3 text-left outline-none flex items-center justify-between gap-3 ${
            disabled
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              : open
              ? "border-[#87CCC8] bg-white"
              : "border-gray-200 bg-white"
          }`}
        >
          <span className={value ? "text-[#2F2F2F]" : "text-gray-400"}>
            {disabled
              ? disabledText
              : selectedOption?.nombre || value || emptyLabel}
          </span>

          <ChevronDown
            size={18}
            className={`transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      </label>

      {helperText && (
        <p className="mt-2 text-xs text-gray-500 leading-5">
          {helperText}
        </p>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[78px] z-40 rounded-3xl border border-[#87CCC8]/20 bg-white smika-shadow p-3">
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
            <button
              type="button"
              onClick={() => handleSelect("")}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-[#F8F6F7]"
            >
              {emptyLabel}
              {!value && <Check size={17} className="text-[#87CCC8]" />}
            </button>

            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.nombre)}
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

                {value === option.nombre && (
                  <Check size={17} className="text-[#87CCC8]" />
                )}
              </button>
            ))}

            {!cleanSearch && !value && (
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
                {createLabel
                  ? createLabel(cleanSearch)
                  : `Agregar “${cleanSearch}”`}
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

            {cleanSearch && exactExists && (
              <div className="mt-2 rounded-2xl bg-[#F8F6F7] px-4 py-3 text-sm font-bold text-gray-500">
                Ese registro ya existe en la lista.
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

export default CreatableSelect;