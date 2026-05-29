function SwitchInput({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full rounded-3xl border border-[#87CCC8]/20 bg-white p-4 flex items-center justify-between gap-4 text-left hover:bg-[#F8F6F7]"
    >
      <div>
        <p className="font-black">{label}</p>

        {description && (
          <p className="mt-1 text-sm text-gray-500 leading-5">
            {description}
          </p>
        )}
      </div>

      <span
        className={`relative h-8 w-14 rounded-full transition ${
          checked ? "bg-[#87CCC8]" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export default SwitchInput;