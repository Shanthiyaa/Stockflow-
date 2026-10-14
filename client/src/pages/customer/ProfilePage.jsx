import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/ui/Alert';
import { User, Lock, MapPin, Plus, Trash2, Star } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', phone: '', isDefault: false });

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(profile);
      updateUser(res.data.data.user);
      showMsg('success', 'Profile updated successfully!');
    } catch (err) { showMsg('error', getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { showMsg('error', 'Passwords do not match.'); return; }
    if (pwdForm.newPassword.length < 6) { showMsg('error', 'New password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('success', 'Password changed successfully!');
    } catch (err) { showMsg('error', getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleAddAddress = async () => {
    const required = ['fullName', 'addressLine1', 'city', 'state', 'pincode', 'phone'];
    if (!required.every(f => newAddr[f]?.trim())) { showMsg('error', 'Please fill in all required fields.'); return; }
    setSaving(true);
    try {
      const res = await userAPI.addAddress(newAddr);
      setAddresses(res.data.data.addresses);
      setAddingAddress(false);
      setNewAddr({ fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
      showMsg('success', 'Address added.');
    } catch (err) { showMsg('error', getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const res = await userAPI.deleteAddress(addrId);
      setAddresses(res.data.data.addresses);
      showMsg('success', 'Address removed.');
    } catch (err) { showMsg('error', getErrorMessage(err)); }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">My Account</h1>

      {msg.text && <Alert variant={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} className="mb-4" />}

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <aside className="sm:w-48 flex-shrink-0">
          <div className="card p-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${tab === id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* Profile */}
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="section-title mb-5">Personal Information</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input className="input bg-slate-50" value={user?.email} disabled readOnly />
                  <p className="error-text text-slate-400">Email cannot be changed.</p>
                </div>
                <div className="form-group">
                  <label className="label">Phone Number</label>
                  <input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
                </div>
                <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div className="card p-6">
              <h2 className="section-title mb-5">Change Password</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Current Password</label>
                  <input type="password" className="input" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">New Password</label>
                  <input type="password" className="input" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" value={pwdForm.confirmPassword} onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
                <button className="btn btn-primary" onClick={handlePasswordChange} disabled={saving}>{saving ? 'Saving...' : 'Change Password'}</button>
              </div>
            </div>
          )}

          {/* Addresses */}
          {tab === 'addresses' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">Saved Addresses</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setAddingAddress(!addingAddress)}><Plus className="w-3.5 h-3.5" /> Add</button>
              </div>

              {addingAddress && (
                <div className="border border-slate-200 rounded-xl p-4 mb-5 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">New Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'fullName', label: 'Full Name *', placeholder: 'John Doe', span: 2 },
                      { key: 'addressLine1', label: 'Address Line 1 *', placeholder: 'House No, Street', span: 2 },
                      { key: 'addressLine2', label: 'Address Line 2', placeholder: 'Area, Landmark', span: 2 },
                      { key: 'city', label: 'City *', placeholder: 'Mumbai' },
                      { key: 'state', label: 'State *', placeholder: 'Maharashtra' },
                      { key: 'pincode', label: 'PIN Code *', placeholder: '400001' },
                      { key: 'phone', label: 'Phone *', placeholder: '9876543210' },
                    ].map(({ key, label, placeholder, span }) => (
                      <div key={key} className={`form-group ${span === 2 ? 'sm:col-span-2' : ''}`}>
                        <label className="label">{label}</label>
                        <input className="input" placeholder={placeholder} value={newAddr[key]} onChange={e => setNewAddr(p => ({ ...p, [key]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newAddr.isDefault} onChange={e => setNewAddr(p => ({ ...p, isDefault: e.target.checked }))} />
                        <span className="text-sm text-slate-600">Set as default address</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="btn btn-secondary" onClick={() => setAddingAddress(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleAddAddress} disabled={saving}>{saving ? 'Saving...' : 'Save Address'}</button>
                  </div>
                </div>
              )}

              {addresses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No addresses saved yet.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div key={addr._id} className={`border rounded-xl p-4 ${addr.isDefault ? 'border-navy-300 bg-navy-50' : 'border-slate-200'}`}>
                      {addr.isDefault && <span className="badge bg-navy-100 text-navy-700 mb-2"><Star className="w-3 h-3 mr-1" />Default</span>}
                      <div className="text-sm text-slate-600 space-y-0.5">
                        <p className="font-medium text-slate-800">{addr.fullName}</p>
                        <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                        <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                        <p>📞 {addr.phone}</p>
                      </div>
                      <button onClick={() => handleDeleteAddress(addr._id)} className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
