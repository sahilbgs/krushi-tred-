import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const UserManagement = () => {
  const { subUsers, createSubUser, updateSubUserPermissions } = useData();
  const { userProfile } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    mobile: '',
    role: 'sub_user',
    permissions: {
      farmerMaster: true,
      supplierMaster: false,
      seedMaster: true,
      purchaseEntry: false,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      reports: false
    }
  });

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'main_admin') {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '30px' }}>
        <h2 style={{ color: '#b91c1c' }}>પ્રતિબંધિત એક્સેસ (Restricted Access)</h2>
        <p className="muted">ફક્ત Main Admin જ સબ-યુઝર અને સ્ટાફની પરવાનગીઓ સંચાલિત કરી શકે છે.</p>
      </div>
    );
  }

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newUser.displayName || !newUser.email) return;
    createSubUser(newUser);
    setNotice(`સબ-યુઝર "${newUser.displayName}" સફળતાપૂર્વક ઉમેરાયા.`);
    setShowAddForm(false);
    setNewUser({
      displayName: '',
      email: '',
      mobile: '',
      role: 'sub_user',
      permissions: {
        farmerMaster: true,
        supplierMaster: false,
        seedMaster: true,
        purchaseEntry: false,
        salesBilling: true,
        stockManagement: true,
        payments: true,
        reports: false
      }
    });
  };

  const handleTogglePermission = (permKey) => {
    if (!selectedUserForEdit) return;
    const updated = {
      ...selectedUserForEdit.permissions,
      [permKey]: !selectedUserForEdit.permissions[permKey]
    };
    updateSubUserPermissions(selectedUserForEdit.uid, updated);
    setSelectedUserForEdit(prev => ({ ...prev, permissions: updated }));
    setNotice('પરવાનગીઓ અપડેટ થઈ ગઈ.');
  };

  const permissionLabels = [
    { key: 'purchaseEntry', label: 'ખરીદી એન્ટ્રી (Purchase Entry)' },
    { key: 'salesBilling', label: 'વેચાણ & સાદું બિલિંગ (Sales Billing)' },
    { key: 'stockManagement', label: 'સ્ટોક લેજર જોવું (Stock Ledger View)' },
    { key: 'farmerMaster', label: 'ખેડૂત માસ્ટર (Farmer Master)' },
    { key: 'supplierMaster', label: 'પેઢી / સપ્લાયર્સ માસ્ટર' },
    { key: 'seedMaster', label: 'બિયારણ જાતો માસ્ટર' },
    { key: 'payments', label: 'જમા-ઉધાર વાઉચર (Payments)' },
    { key: 'reports', label: 'હિસાબી રિપોર્ટ્સ (Reports View)' }
  ];

  return (
    <div>
      {notice && (
        <div className="notice" onClick={() => setNotice('')} style={{ marginBottom: '16px' }}>
          {notice} ×
        </div>
      )}

      {/* Header & Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          type="button"
          className="primary-action" 
          style={{ width: 'auto', padding: '9px 18px' }}
          onClick={() => setShowAddForm(prev => !prev)}>
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવો સ્ટાફ / સબ-યુઝર ઉમેરો'}
        </button>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel formgrid" onSubmit={handleCreate} style={{ marginBottom: '24px' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0, color: '#14532d' }}>
            નવો સ્ટાફ / સબ-યુઝર બનાવો
          </h2>

          <label>
            સ્ટાફનું પૂરું નામ*
            <input 
              required 
              value={newUser.displayName} 
              onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
              placeholder="દા.ત. ભાર્ગવ ચૌધરી"
            />
          </label>

          <label>
            ઈમેલ આઈડી*
            <input 
              required 
              type="email"
              value={newUser.email} 
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="bhargav@nandiniseeds.com"
            />
          </label>

          <label>
            મોબાઇલ નંબર
            <input 
              value={newUser.mobile} 
              onChange={e => setNewUser({ ...newUser, mobile: e.target.value })}
              placeholder="10 અંકનો નંબર"
            />
          </label>

          <label>
            રોલ (Role)
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="sub_user">Sub User (સ્ટાફ)</option>
              <option value="admin">Main Admin (પૂર્ણ અધિકાર)</option>
            </select>
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              યુઝર સાચવો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Sub Users Table */}
      <h2>સ્ટાફ & યુઝર પરવાનગીઓ ({subUsers.length})</h2>
      <div className="tablewrap" style={{ marginBottom: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>નામ</th>
              <th>ઈમેલ</th>
              <th>મોબાઇલ</th>
              <th>રોલ</th>
              <th>ખરીદી</th>
              <th>વેચાણ</th>
              <th>સ્ટોક</th>
              <th>ખાતાવહી</th>
              <th>રિપોર્ટ્સ</th>
              <th>એક્શન</th>
            </tr>
          </thead>
          <tbody>
            {subUsers.map(u => (
              <tr key={u.uid}>
                <td><b>{u.displayName}</b></td>
                <td>{u.email}</td>
                <td>{u.mobile || '—'}</td>
                <td>
                  <span style={{ fontWeight: '700', color: u.role === 'admin' ? '#15803d' : '#b45309' }}>
                    {u.role === 'admin' ? 'Main Admin' : 'Sub User'}
                  </span>
                </td>
                <td>{u.role === 'admin' || u.permissions?.purchaseEntry ? '✅' : '❌'}</td>
                <td>{u.role === 'admin' || u.permissions?.salesBilling ? '✅' : '❌'}</td>
                <td>{u.role === 'admin' || u.permissions?.stockManagement ? '✅' : '❌'}</td>
                <td>{u.role === 'admin' || u.permissions?.payments ? '✅' : '❌'}</td>
                <td>{u.role === 'admin' || u.permissions?.reports ? '✅' : '❌'}</td>
                <td>
                  <button 
                    type="button"
                    className="secondary" 
                    style={{ padding: '3px 8px', fontSize: '0.8rem' }}
                    onClick={() => setSelectedUserForEdit(u)}>
                    પરવાનગીઓ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Modal */}
      {selectedUserForEdit && (
        <div className="modal-backdrop">
          <div className="panel" style={{ maxWidth: '500px', width: '100%', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#14532d' }}>
                પરવાનગીઓ બદલો: {selectedUserForEdit.displayName}
              </h3>
              <button 
                type="button"
                className="secondary"
                onClick={() => setSelectedUserForEdit(null)}>
                ✕
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 12px 0' }}>
              જે મોડ્યુલની છૂટ આપવી હોય તેને ચેકમાર્ક કરો:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {permissionLabels.map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedUserForEdit.permissions?.[p.key]} 
                    onChange={() => handleTogglePermission(p.key)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="primary-action" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => setSelectedUserForEdit(null)}>
                પૂર્ણ થયું
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firestore Security Note */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <h3>🔐 Firestore User Setup & Security Rule</h3>
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          Firebase Authentication માં account બનાવ્યા પછી, `users/{uid}` document માં role=`staff`, active=true અને જરૂરી permissions મૂકીને યુઝર એક્સેસ સુરક્ષિત કરી શકાય છે:
        </p>
        <pre style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
{`{
  "role": "staff",
  "displayName": "Bhargav Chaudhary",
  "active": true,
  "permissions": {
    "farmerMaster": true,
    "salesBilling": true,
    "stockManagement": true,
    "purchaseEntry": true,
    "payments": true,
    "reports": false
  }
}`}
        </pre>
      </div>
    </div>
  );
};
export default UserManagement;
