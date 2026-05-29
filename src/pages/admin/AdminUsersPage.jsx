import AdminPlaceholderPage from "./AdminPlaceholderPage";

function AdminUsersPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Usuarios"
      title="Gestión de clientes, admin y subadmin"
      description="Aquí se gestionarán clientes registrados, administradores y subadministradores. Admin y subadmin tendrán acceso a las mismas secciones por ahora."
      buttonText="Agregar usuario"
    />
  );
}

export default AdminUsersPage;