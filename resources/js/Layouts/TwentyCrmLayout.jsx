import AdminLayout from "./AdminLayout";
import "../../css/admin/twenty.css";
import "../../css/admin/crm-design.css";
import "../../css/admin/workspace.css";

export default function TwentyCrmLayout({ children, title, headerActions }) {
  return (
    <AdminLayout title={title} headerActions={headerActions} section="crm">
      <div className="twenty-content-area panel-crm-content">{children}</div>
    </AdminLayout>
  );
}
