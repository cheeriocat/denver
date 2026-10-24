// src/admin/products/AdminProductsPage.jsx
// Full products manager: list, add, edit, toggle visibility, delete.
// Also contains the "Import Mock Products" one-time seeder button.

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { seedProducts } from '../../scripts/seedProducts';
import { Plus, Edit2, Trash2, Eye, EyeOff, Download, Search } from 'lucide-react';
import ProductForm from './ProductForm';

function fmtRs(n) {
  return n != null ? `Rs. ${Number(n).toLocaleString('en-LK')}` : '—';
}

function totalStock(stockMap) {
  if (!stockMap) return 0;
  return Object.values(stockMap).reduce((s, v) => s + (Number(v) || 0), 0);
}

export default function AdminProductsPage() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editProduct, setEdit]    = useState(null);   // null → add mode
  const [seeding, setSeeding]     = useState(false);
  const [seedMsg, setSeedMsg]     = useState('');
  const [deleting, setDeleting]   = useState(null);   // product id being deleted
  const [confirmDel, setConfirmDel] = useState(null); // product to confirm delete

  // ── Real-time products list ───────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error('products snapshot:', err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Toggle visibility ─────────────────────────────────────────────────────
  const toggleActive = async (product) => {
    await setDoc(
      doc(db, 'products', product.id),
      { active: !product.active, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (product) => {
    setDeleting(product.id);
    try {
      await deleteDoc(doc(db, 'products', product.id));
    } catch (err) {
      console.error('delete product:', err);
    } finally {
      setDeleting(null);
      setConfirmDel(null);
    }
  };

  // ── Seed mock products ────────────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const result = await seedProducts();
      if (result.skipped) {
        setSeedMsg('Products already exist in Firestore — nothing was imported.');
      } else {
        setSeedMsg(`✓ Imported ${result.seeded} products successfully.`);
      }
    } catch (err) {
      setSeedMsg(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  // ── Open forms ────────────────────────────────────────────────────────────
  const openAdd  = () => { setEdit(null); setShowForm(true); };
  const openEdit = (p) => { setEdit(p);   setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEdit(null); };

  return (
    <div className="adm-page">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Catalogue</div>
          <h1 className="adm-page-title">Products</h1>
        </div>
        <div className="adm-page-actions">
          {/* Import mock data button */}
          <button
            id="seed-products-btn"
            className="adm-btn-secondary"
            onClick={handleSeed}
            disabled={seeding}
            title="One-time import of 6 mock products into Firestore"
          >
            <Download size={14} />
            {seeding ? 'Importing…' : 'Import Mock Data'}
          </button>

          <button id="add-product-btn" className="adm-btn-primary" onClick={openAdd}>
            <Plus size={14} />
            Add Product
          </button>
        </div>
      </div>

      {seedMsg && (
        <div
          className={`adm-seed-msg ${seedMsg.startsWith('✓') ? 'success' : ''}`}
          style={{ marginBottom: '16px' }}
        >
          {seedMsg}
        </div>
      )}

      {/* ── Search ───────────────────────────────────────── */}
      <div className="adm-search-row">
        <Search size={14} className="adm-search-icon" />
        <input
          className="adm-search-input"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="adm-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Products table ───────────────────────────────── */}
      {loading ? (
        <div className="adm-loading">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">
          {search ? 'No products match your search.' : 'No products yet. Import mock data or add a product.'}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={!p.active ? 'adm-row-hidden' : ''}>
                  <td>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="adm-product-thumb" />
                      : <div className="adm-product-thumb adm-no-img">—</div>
                    }
                  </td>
                  <td>
                    <div className="adm-product-name">{p.name}</div>
                    <div className="adm-product-desc">{p.description}</div>
                  </td>
                  <td>
                    <span className="adm-category-badge">{p.category}</span>
                  </td>
                  <td>
                    <div>{fmtRs(p.price)}</div>
                    {p.originalPrice && (
                      <div className="adm-price-old">{fmtRs(p.originalPrice)}</div>
                    )}
                  </td>
                  <td>
                    <div className={`adm-stock ${totalStock(p.stock) === 0 ? 'adm-stock-zero' : ''}`}>
                      {totalStock(p.stock)} units
                    </div>
                    <div className="adm-stock-sizes">
                      {p.stock && Object.entries(p.stock).map(([sz, qty]) => (
                        <span key={sz} className="adm-stock-tag">{sz}: {qty}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`adm-status-badge ${p.active ? 'active' : 'hidden'}`}>
                      {p.active ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      {/* Toggle visibility */}
                      <button
                        className="adm-icon-btn"
                        onClick={() => toggleActive(p)}
                        title={p.active ? 'Hide product' : 'Show product'}
                      >
                        {p.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      {/* Edit */}
                      <button
                        className="adm-icon-btn"
                        onClick={() => openEdit(p)}
                        title="Edit product"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete */}
                      {confirmDel?.id === p.id ? (
                        <div className="adm-confirm-del">
                          <span>Delete?</span>
                          <button
                            className="adm-btn-danger-sm"
                            onClick={() => handleDelete(p)}
                            disabled={deleting === p.id}
                          >
                            {deleting === p.id ? '…' : 'Yes'}
                          </button>
                          <button className="adm-btn-secondary-sm" onClick={() => setConfirmDel(null)}>
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="adm-icon-btn adm-icon-btn-danger"
                          onClick={() => setConfirmDel(p)}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Product form modal ───────────────────────────── */}
      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={closeForm}
          onSaved={closeForm}
        />
      )}

      {/* Confirm delete — handled inline in row above */}
    </div>
  );
}
