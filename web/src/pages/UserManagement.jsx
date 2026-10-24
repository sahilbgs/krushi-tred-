import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserPlus, ShieldAlert, Check, X, Lock } from 'lucide-react';

export const UserManagement = () => {
  const { subUsers, createSubUser, updateSubUserPermissions } = useData();
  const { userProfile } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
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
      reports: false,
      viewRates: false
    }
  });

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'main_admin') {
    return (
      <div className="page-body">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <ShieldAlert size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#991b1b' }}>પ્રતિબંધિત એક્સેસ (Restricted Access)</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            ફક્ત Main Admin જ સબ-યુઝર અને સ્ટાફની પરવાનગીઓ સંચાલિત કરી શકે છે.
          </p>
        </div>
      </div>
    );
  }

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newUser.displayName || !newUser.email) return;
    createSubUser(newUser);
    setShowAddModal(false);
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
        reports: false,
        viewRates: false
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
  };

  const permissionLabels = [
    { key: 'salesBilling', label: 'વેચાણ & સાદું બિલિંગ (Sales Billing)' },
    { key: 'farmerMaster', label: 'ખેડૂત વિગત ઉમેરવી / જોવી (Farmer Master)' },
    { key: 'stockManagement', label: 'સ્ટોક લેજર જોવું (Stock Ledger View)' },
    { key: 'payments', label: 'જમા-ઉધાર વસૂલાત નોંધવી (Payments & Udhar)' },
    { key: 'purchaseEntry', label: 'નવી ખરીદી એન્ટ્રી (Purchase Entry)' },
    { key: 'supplierMaster', label: 'સપ્લાયર્સ માસ્ટર (Supplier Master)' },
    { key: 'seedMaster', label: 'બિયારણ જાતો માસ્ટર (Seed Master)' },
    { key: 'reports', label: 'હિસાબી રિપોર્ટ્સ (Reports View)' },
    { key: 'viewRates', label: 'ખરીદી ભાવ જોવાની છૂટ (View Purchase Rates)' }
  ];

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={24} />
            સ્ટાફ & પરવાનગી સંચાલન (Sub Users & Permissions)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            દરેક સ્ટાફ યુઝર માટે અલગ લૉગિન અને વ્યક્તિગત પરવાનગીઓનું નિયંત્રણ
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          નવો સ્ટાફ યુઝર બનાવો
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>નામ</th>
                <th>લૉગિન Email</th>
                <th>મોબાઇલ</th>
                <th>રોલ (Role)</th>
                <th>સક્રિય પરવાનગીઓ (Active Permissions)</th>
                <th>એક્શન</th>
              </tr>
            </thead>
            <tbody>
              {subUsers.map(u => (
                <tr key={u.uid}>
                  <td style={{ fontWeight: '600' }}>{u.displayName}</td>
                  <td>{u.email}</td>
                  <td>{u.mobile || '—'}</td>
                  <td>
                    <span className="badge badge-warning">સ્ટાફ (Sub User)</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {Object.entries(u.permissions || {})
                        .filter(([_, allowed]) => allowed)
                        .map(([key]) => (
                          <span key={key} className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            {key === 'salesBilling' ? 'બિલિંગ' :
                             key === 'farmerMaster' ? 'ખેડૂત' :
                             key === 'stockManagement' ? 'સ્ટોક' :
                             key === 'payments' ? 'પેમેન્ટ' :
                             key === 'purchaseEntry' ? 'ખરીદી' : key}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedUserForEdit(u)}>
                      પરવાનગી બદલો
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Editor Modal */}
      {selectedUserForEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>
                પરવાનગીઓ: {selectedUserForEdit.displayName}
              </h3>
              <button onClick={() => setSelectedUserForEdit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
                આ સ્ટાફ યુઝરને જે મોડ્યુલની પરવાનગી આપવી હોય તે ચેકબોક્સ ચાલુ કરો:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {permissionLabels.map(p => {
                  const isChecked = !!selectedUserForEdit.permissions?.[p.key];
                  return (
                    <label 
                      key={p.key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: isChecked ? '#f0fdf4' : '#f8fafc',
                        border: isChecked ? '1px solid #86efac' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: isChecked ? '600' : '400', color: isChecked ? '#166534' : '#334155' }}>
                        {p.label}
                      </span>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleTogglePermission(p.key)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedUserForEdit(null)}>
                સેવ કરો & બંધ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Sub User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>નવો સ્ટાફ યુઝર ઉમેરો</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">સ્ટાફનું પૂરું નામ *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email ID (Login માટે) *</label>
                  <input 
                    type="email" 
                    required 
                    className="form-control" 
                    placeholder="staff1@krushitrade.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">મોબાઇલ નંબર</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="૧૦ આંકડાનો મોબાઇલ"
                    value={newUser.mobile}
                    onChange={(e) => setNewUser(prev => ({ ...prev, mobile: e.target.value }))}
                  />
                </div>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: '#92400e' }}>
                  નોંધ: સ્ટાફ યુઝર બન્યા પછી તમે તેની પરવાનગીઓ જરૂરિયાત મુજબ ગમે ત્યારે સુધારી શકશો.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">યુઝર એકાઉન્ટ બનાવો</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
