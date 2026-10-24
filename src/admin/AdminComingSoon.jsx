// src/admin/AdminComingSoon.jsx
// Placeholder panel for admin sections not yet implemented.
export default function AdminComingSoon({ title = 'Coming Soon' }) {
  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Denver Admin</div>
          <h1 className="adm-page-title">{title}</h1>
        </div>
      </div>
      <div className="adm-empty" style={{ marginTop: '60px' }}>
        This section is coming in a future phase.
      </div>
    </div>
  );
}
