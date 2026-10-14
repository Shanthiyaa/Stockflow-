import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { categoryAPI } from '../../api';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

const EMPTY = { name: '', description: '', image: '', isActive: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, cat: null });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetch = () => categoryAPI.getAllAdmin().then(r => { setCategories(r.data.data.categories); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '', image: c.image || '', isActive: c.isActive }); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await categoryAPI.update(editing._id, form);
        setSuccess('Category updated.');
      } else {
        await categoryAPI.create(form);
        setSuccess('Category created.');
      }
      setModalOpen(false); fetch();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal.cat) return;
    setDeleting(true);
    try {
      await categoryAPI.delete(deleteModal.cat._id);
      setDeleteModal({ open: false, cat: null });
      setSuccess('Category deleted.');
      fetch();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteModal({ open: false, cat: null });
    } finally { setDeleting(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Categories</h1><p className="text-sm text-slate-500 mt-1">{categories.length} categories</p></div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Category</button>
      </div>

      {success && <Alert variant="success" message={success} onClose={() => setSuccess('')} className="mb-4" />}
      {error && !modalOpen && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>{['Category', 'Slug', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="td text-center py-12 text-slate-400">No categories yet.</td></tr>
              ) : categories.map(cat => (
                <tr key={cat._id} className="tr-hover">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {cat.image ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" /> : <Tag className="w-4 h-4 m-3 text-slate-300" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{cat.description || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td"><span className="text-xs font-mono text-slate-500">{cat.slug}</span></td>
                  <td className="td">
                    <span className={`badge ${cat.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="td text-sm text-slate-500">{formatDate(cat.createdAt)}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteModal({ open: true, cat })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'} size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </>
        }>
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Category Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Electronics" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
          </div>
          <div className="form-group">
            <label className="label">Image URL</label>
            <input className="input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <span className="text-sm text-slate-600">Active</span>
          </label>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, cat: null })} onConfirm={handleDelete}
        title="Delete Category" message={`Delete "${deleteModal.cat?.name}"? This will fail if products are assigned to it.`}
        confirmText="Delete" loading={deleting} />
    </div>
  );
}
