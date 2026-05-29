function FormSection({ title, description, children }) {
  return (
    <div className="rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow">
      <div>
        <h3 className="text-2xl font-black">{title}</h3>

        {description && (
          <p className="mt-2 text-sm text-gray-600 leading-6">
            {description}
          </p>
        )}
      </div>

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}

export default FormSection;