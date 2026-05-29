import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
  name,
  value,
  onChange,
  placeholder = "Contraseña",
  className = ""
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-12 outline-none focus:border-[#87CCC8]"
      />

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#87CCC8]"
        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
    </div>
  );
}

export default PasswordInput;