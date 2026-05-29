import AdminPlaceholderPage from "./AdminPlaceholderPage";

function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Configuración"
      title="Configuración de la tienda"
      description="Aquí se configurarán datos generales como WhatsApp, redes sociales, límites de precio, textos visibles y parámetros visuales."
      buttonText="Guardar configuración"
    />
  );
}

export default AdminSettingsPage;