import { Route, Routes } from "react-router-dom";

import AdminRoute from "./components/auth/AdminRoute";

import PublicLayout from "./components/layout/PublicLayout";
import HomePage from "./pages/public/HomePage";
import CatalogPage from "./pages/public/CatalogPage";
import ProductDetailPage from "./pages/public/ProductDetailPage";
import CartPage from "./pages/public/CartPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import UserProfilePage from "./pages/public/UserProfilePage";
import UserSettingsPage from "./pages/public/UserSettingsPage";
import EventSchedulePage from "./pages/public/EventSchedulePage";
import EventDetailPage from "./pages/public/EventDetailPage";
import SeriesDetailPage from "./pages/public/SeriesDetailPage";

import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductTypesPage from "./pages/admin/AdminProductTypesPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminSeriesPage from "./pages/admin/AdminSeriesPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminCharactersPage from "./pages/admin/AdminCharactersPage";
import AdminCreatorsPage from "./pages/admin/AdminCreatorsPage";
import AdminOriginsPage from "./pages/admin/AdminOriginsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSubadminsPage from "./pages/admin/AdminSubadminsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/nuevos-productos"
          element={<CatalogPage title="Nuevos productos" />}
        />

        <Route path="/series" element={<CatalogPage title="Series" />} />
        <Route path="/series/detalle/:slug" element={<SeriesDetailPage />} />
        <Route
          path="/series/:subcategory"
          element={<CatalogPage title="Series" />}
        />

        <Route path="/eventos" element={<CatalogPage title="Eventos" />} />
        <Route
          path="/eventos/:subcategory"
          element={<CatalogPage title="Eventos" />}
        />

        <Route path="/libros" element={<CatalogPage title="Libros" />} />
        <Route
          path="/libros/:subcategory"
          element={<CatalogPage title="Libros" />}
        />

        <Route path="/preventa" element={<CatalogPage title="Preventa" />} />
        <Route
          path="/preventa/:subcategory"
          element={<CatalogPage title="Preventa" />}
        />

        <Route
          path="/personalizados"
          element={<CatalogPage title="Personalizados" />}
        />

        <Route path="/productos/:slug" element={<ProductDetailPage />} />
        <Route path="/lista-pedido" element={<CartPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        <Route path="/mi-cuenta" element={<UserProfilePage />} />
        <Route
          path="/mi-cuenta/configuracion"
          element={<UserSettingsPage />}
        />

        <Route path="/programacion-eventos" element={<EventSchedulePage />} />
        <Route
          path="/programacion-eventos/:slug"
          element={<EventDetailPage />}
        />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="productos" element={<AdminProductsPage />} />
          <Route path="tipos-producto" element={<AdminProductTypesPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="eventos" element={<AdminEventsPage />} />
          <Route path="series" element={<AdminSeriesPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
          <Route path="personajes" element={<AdminCharactersPage />} />
          <Route path="creadores" element={<AdminCreatorsPage />} />
          <Route path="origenes" element={<AdminOriginsPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="subadmins" element={<AdminSubadminsPage />} />
          <Route path="configuracion" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;