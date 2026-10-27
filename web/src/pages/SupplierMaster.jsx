import React, { useState } from 'react';
import { useData, getPartyTagInfo } from '../context/DataContext';

export const SupplierMaster = () => {
  const { parties, addParty } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const [newSup, setNewSup] = useState({
    partyType: 'firm', // 'firm' | 'supplier' | 'trader'
    companyName: '',
    contactPerson: '',
    mobile: '',
    city: '',
    openingBalance: '0',
    balanceType: 'cr'
  });

  // Filter suppliers / firms / traders
  const firmAndSuppliers = parties.filter(p => {
    if (selectedTag === 'all') {
      return p.partyType === 'firm' || p.partyType === 'supplier' || p.partyType === 'trader' || p.partyType === 'other';
    }
    return p.partyType === selectedTag;
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newSup.companyName.trim()) return;

    const opBal = parseFloat(newSup.openingBalance) || 0;
    const created = addParty({
      partyType: newSup.partyType,
      name: newSup.companyName.trim(),
      firmName: newSup.contactPerson.trim() ? `${newSup.companyName.trim()} (${newSup.contactPerson.trim()})` : newSup.companyName.trim(),
      mobile: newSup.mobile.trim(),
      village: newSup.city.trim(),
      city: newSup.city.trim(),
      contactPerson: newSup.contactPerson.trim(),
      openingBalance: opBal,
      currentBalance: opBal,
      openingBalanceType: newSup.balanceType || 'cr',
      balanceType: newSup.balanceType || 'cr'
    });

    const tagInfo = getPartyTagInfo(created.partyType);
    setNotice(`પેઢી / સપ્લાયર "${created.name}" [${tagInfo.label}] સફળતાપૂર્વક ઉમેરાયા.`);
    setNewSup({
      partyType: 'firm',
      companyName: '',
      contactPerson: '',
      mobile: '',
      city: '',
      openingBalance: '0',
      balanceType: 'cr'
    });
    setShowAddForm(false);
  };

  return (
    <div>
      {notice && (
        <div className="notice" onClick={() => setNotice('')} style={{ marginBottom: '16px' }}>
          {notice} ×
        </div>
      )}

      {/* Header & Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          type="button"
          className="primary-action" 
          style={{ width: 'auto', padding: '9px 18px' }}
          onClick={() => setShowAddForm(prev => !prev)}>
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવી પેઢી / સપ્લાયર ઉમેરો'}
        </button>

        <div className="tag-filter-pills" style={{ margin: 0 }}>
          <button
            type="button"
            className={`tag-pill-btn ${selectedTag === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTag('all')}
          >
            બધા ({parties.filter(p => ['firm', 'supplier', 'trader', 'other'].includes(p.partyType)).length})
          </button>
          <button
            type="button"
            className={`tag-pill-btn ${selectedTag === 'firm' ? 'active' : ''}`}
            onClick={() => setSelectedTag('firm')}
          >
            🏢 પેઢી ({parties.filter(p => p.partyType === 'firm').length})
          </button>
          <button
            type="button"
            className={`tag-pill-btn ${selectedTag === 'supplier' ? 'active' : ''}`}
            onClick={() => setSelectedTag('supplier')}
          >
            🚚 સપ્લાયર ({parties.filter(p => p.partyType === 'supplier').length})
          </button>
          <button
            type="button"
            className={`tag-pill-btn ${selectedTag === 'trader' ? 'active' : ''}`}
            onClick={() => setSelectedTag('trader')}
          >
            👤 અન્ય વેપારી ({parties.filter(p => ['trader', 'other'].includes(p.partyType)).length})
          </button>
        </div>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel" onSubmit={handleSave} style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#14532d' }}>
            નવી પેઢી / સપ્લાયર ઉમેરો
          </h2>

          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#14532d', display: 'block', marginBottom: '6px' }}>
              ટેગ (વર્ગીકરણ) પસંદ કરો:*
            </span>
            <div className="tag-selector-row">
              {[
                { type: 'firm', icon: '🏢', label: 'પેઢી', sub: 'Pedhi / Firm' },
                { type: 'supplier', icon: '🚚', label: 'સપ્લાયર', sub: 'Supplier' },
                { type: 'trader', icon: '👤', label: 'અન્ય વેપારી / વ્યક્તિ', sub: 'Trader / Person' }
              ].map(t => (
                <div
                  key={t.type}
                  className={`tag-select-option ${newSup.partyType === t.type ? 'selected' : ''}`}
                  onClick={() => setNewSup(prev => ({ ...prev, partyType: t.type }))}
                >
                  <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                  <span>{t.label}</span>
                  <small style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.sub}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="formgrid">
            <label>
              કંપની / પેઢીનું નામ*
              <input 
                required 
                value={newSup.companyName} 
                onChange={e => setNewSup({ ...newSup, companyName: e.target.value })}
                placeholder="દા.ત. શ્રી ગણેશ ટ્રેડિંગ કંપની"
              />
            </label>

            <label>
              સંપર્ક વ્યક્તિ (Contact Person)
              <input 
                value={newSup.contactPerson} 
                onChange={e => setNewSup({ ...newSup, contactPerson: e.target.value })}
                placeholder="વેપારી / માલિકનું નામ"
              />
            </label>

            <label>
              મોબાઇલ નંબર
              <input 
                value={newSup.mobile} 
                onChange={e => setNewSup({ ...newSup, mobile: e.target.value })}
                placeholder="10 અંકનો મોબાઇલ"
              />
            </label>

            <label>
              શહેર / માર્કેટ યાર્ડ
              <input 
                value={newSup.city} 
                onChange={e => setNewSup({ ...newSup, city: e.target.value })}
                placeholder="રાજકોટ, ગોંડલ..."
              />
            </label>

            <label>
              શરૂઆતની બાકી (Opening Balance ₹)
              <input 
                type="number" 
                min="0"
                value={newSup.openingBalance} 
                onChange={e => setNewSup({ ...newSup, openingBalance: e.target.value })}
              />
            </label>

            <label>
              બાકી પ્રકાર
              <select
                value={newSup.balanceType}
                onChange={e => setNewSup({ ...newSup, balanceType: e.target.value })}
              >
                <option value="cr">CR (જમા - સપ્લાયરને આપણે આપવાના)</option>
                <option value="dr">DR (ઉધાર - સપ્લાયર પાસેથી લેવાના)</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              સાચવો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Supplier List Table */}
      <h2>પેઢી / સપ્લાયર્સ યાદી ({firmAndSuppliers.length})</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>કોડ</th>
              <th>ટેગ</th>
              <th>કંપની / પેઢીનું નામ</th>
              <th>સંપર્ક વ્યક્તિ</th>
              <th>મોબાઇલ</th>
              <th>શહેર / યાર્ડ</th>
              <th>બાકી રકમ (₹)</th>
            </tr>
          </thead>
          <tbody>
            {firmAndSuppliers.map(sup => {
              const tagInfo = getPartyTagInfo(sup.partyType);
              const balNum = parseFloat(sup.currentBalance) || 0;
              const isCr = (sup.balanceType || '').toLowerCase() === 'cr';

              return (
                <tr key={sup.id}>
                  <td><b>{sup.code || 'SUP'}</b></td>
                  <td>
                    <span className={`party-tag-badge party-tag-${tagInfo.value}`}>
                      {tagInfo.badge}
                    </span>
                  </td>
                  <td><b>{sup.name || sup.companyName}</b></td>
                  <td>{sup.contactPerson || sup.firmName || '—'}</td>
                  <td>{sup.mobile || '—'}</td>
                  <td>{sup.village || sup.city || '—'}</td>
                  <td style={{
                    fontWeight: '700',
                    color: balNum === 0 ? '#16a34a' : (isCr ? '#2563eb' : '#dc2626')
                  }}>
                    {balNum === 0 
                      ? '₹0 (સરભર)' 
                      : `₹${balNum.toLocaleString('en-IN')} ${isCr ? 'CR (આપવાના)' : 'DR (લેવાના)'}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierMaster;
