import React, { useState } from 'react';
import { useData, getPartyTagInfo } from '../context/DataContext';

export const FarmerMaster = ({ onSelectFarmerBills }) => {
  const { parties, addParty } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');

  const [newParty, setNewParty] = useState({
    partyType: 'farmer',
    name: '',
    firmName: '',
    mobile: '',
    village: '',
    taluka: '',
    address: '',
    openingBalance: '0',
    balanceType: 'dr'
  });

  const filteredParties = parties.filter(p => {
    const matchTag = tagFilter === 'all' || 
                     (tagFilter === 'trader' ? ['trader', 'other'].includes(p.partyType) : p.partyType === tagFilter);
    const q = searchTerm.toLowerCase();
    const matchSearch = (p.name || '').toLowerCase().includes(q) ||
                        (p.firmName || '').toLowerCase().includes(q) ||
                        (p.mobile && p.mobile.includes(q)) ||
                        (p.village && p.village.toLowerCase().includes(q)) ||
                        (p.taluka && p.taluka.toLowerCase().includes(q));
    return matchTag && matchSearch;
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newParty.name.trim()) return;

    const opBal = parseFloat(newParty.openingBalance) || 0;
    const isFarmer = newParty.partyType === 'farmer';
    const autoBalanceType = newParty.balanceType || (isFarmer ? 'dr' : 'cr');

    const created = addParty({
      partyType: newParty.partyType,
      name: newParty.name.trim(),
      firmName: newParty.firmName.trim() || (['firm', 'supplier'].includes(newParty.partyType) ? newParty.name.trim() : ''),
      mobile: newParty.mobile.trim(),
      village: newParty.village.trim(),
      taluka: newParty.taluka.trim(),
      address: newParty.address.trim(),
      openingBalance: opBal,
      currentBalance: opBal,
      openingBalanceType: autoBalanceType,
      balanceType: autoBalanceType
    });

    const tagInfo = getPartyTagInfo(created.partyType);
    setNotice(`ખાતેદાર "${created.name}" [${tagInfo.label}] સફળતાપૂર્વક ઉમેરાયા.`);
    setNewParty({
      partyType: 'farmer',
      name: '',
      firmName: '',
      mobile: '',
      village: '',
      taluka: '',
      address: '',
      openingBalance: '0',
      balanceType: 'dr'
    });
    setShowAddForm(false);
  };

  const handleWhatsApp = (p) => {
    if (!p.mobile) return;
    const clean = p.mobile.replace(/\D/g, '');
    const num = clean.length === 10 ? '91' + clean : clean;
    const bal = parseFloat(p.currentBalance || 0).toLocaleString('en-IN');
    const balType = (p.balanceType || '').toUpperCase();
    const msg = `નમસ્તે શ્રી ${p.name}, SHREE NANDINI SEEDS તરફથી આપના ખાતાની બાકી રકમ ₹${bal} ${balType} છે. આભાર!`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const farmerCount = parties.filter(p => p.partyType === 'farmer').length;
  const firmCount = parties.filter(p => p.partyType === 'firm').length;
  const supplierCount = parties.filter(p => p.partyType === 'supplier').length;
  const traderCount = parties.filter(p => ['trader', 'other'].includes(p.partyType)).length;

  return (
    <div>
      {notice && (
        <div className="notice" onClick={() => setNotice('')} style={{ marginBottom: '16px' }}>
          {notice} ×
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          type="button"
          className="primary-action" 
          style={{ width: 'auto', padding: '9px 18px' }}
          onClick={() => setShowAddForm(prev => !prev)}>
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવો ખાતેદાર / ગ્રાહક ઉમેરો'}
        </button>

        <input 
          type="text" 
          placeholder="🔍 નામ, પેઢી, ગામ કે નંબર શોધો..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
      </div>

      {/* Tag Filter Pills */}
      <div className="tag-filter-pills" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`tag-pill-btn ${tagFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTagFilter('all')}
        >
          બધા ખાતેદારો ({parties.length})
        </button>
        <button
          type="button"
          className={`tag-pill-btn ${tagFilter === 'farmer' ? 'active' : ''}`}
          onClick={() => setTagFilter('farmer')}
        >
          🌾 ખેડૂત ({farmerCount})
        </button>
        <button
          type="button"
          className={`tag-pill-btn ${tagFilter === 'firm' ? 'active' : ''}`}
          onClick={() => setTagFilter('firm')}
        >
          🏢 પેઢી ({firmCount})
        </button>
        <button
          type="button"
          className={`tag-pill-btn ${tagFilter === 'supplier' ? 'active' : ''}`}
          onClick={() => setTagFilter('supplier')}
        >
          🚚 સપ્લાયર ({supplierCount})
        </button>
        <button
          type="button"
          className={`tag-pill-btn ${tagFilter === 'trader' ? 'active' : ''}`}
          onClick={() => setTagFilter('trader')}
        >
          👤 અન્ય વેપારી / વ્યક્તિ ({traderCount})
        </button>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel" onSubmit={handleSave} style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#14532d' }}>
            નવો ખાતેદાર / પાર્ટી ઉમેરો
          </h2>

          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#14532d', display: 'block', marginBottom: '6px' }}>
              પાર્ટી ટેગ (વર્ગીકરણ) પસંદ કરો:*
            </span>
            <div className="tag-selector-row">
              {[
                { type: 'farmer', icon: '🌾', label: 'ખેડૂત', sub: 'Farmer' },
                { type: 'firm', icon: '🏢', label: 'પેઢી', sub: 'Pedhi / Firm' },
                { type: 'supplier', icon: '🚚', label: 'સપ્લાયર', sub: 'Supplier' },
                { type: 'trader', icon: '👤', label: 'અન્ય વેપારી / વ્યક્તિ', sub: 'Trader / Person' }
              ].map(t => (
                <div
                  key={t.type}
                  className={`tag-select-option ${newParty.partyType === t.type ? 'selected' : ''}`}
                  onClick={() => setNewParty(prev => ({
                    ...prev,
                    partyType: t.type,
                    balanceType: t.type === 'farmer' ? 'dr' : 'cr'
                  }))}
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
              {['firm', 'supplier'].includes(newParty.partyType) ? 'કંપની / પેઢીનું નામ*' : 'પૂરું નામ*'}
              <input 
                required 
                value={newParty.name} 
                onChange={e => setNewParty({ ...newParty, name: e.target.value })}
                placeholder={['firm', 'supplier'].includes(newParty.partyType) ? 'દા.ત. શ્રી ગણેશ ટ્રેડિંગ કંપની' : 'દા.ત. રમેશભાઈ પટેલ'}
              />
            </label>

            {['firm', 'supplier'].includes(newParty.partyType) && (
              <label>
                સંપર્ક વ્યક્તિ (Contact Person)
                <input 
                  value={newParty.firmName} 
                  onChange={e => setNewParty({ ...newParty, firmName: e.target.value })}
                  placeholder="માલિક / વેપારીનું નામ"
                />
              </label>
            )}

            <label>
              મોબાઇલ નંબર
              <input 
                value={newParty.mobile} 
                onChange={e => setNewParty({ ...newParty, mobile: e.target.value })}
                placeholder="10 અંકનો મોબાઇલ"
              />
            </label>

            <label>
              ગામ / શહેર / માર્કેટ યાર્ડ
              <input 
                value={newParty.village} 
                onChange={e => setNewParty({ ...newParty, village: e.target.value })}
                placeholder="દા.ત. ગોંડલ, રાજકોટ"
              />
            </label>

            <label>
              તાલુકો
              <input 
                value={newParty.taluka} 
                onChange={e => setNewParty({ ...newParty, taluka: e.target.value })}
                placeholder="તાલુકો"
              />
            </label>

            <label>
              સરનામું
              <input 
                value={newParty.address} 
                onChange={e => setNewParty({ ...newParty, address: e.target.value })}
                placeholder="સરનામું / દુકાન નં."
              />
            </label>

            <label>
              શરૂઆતની બાકી (Opening Balance ₹)
              <input 
                type="number" 
                min="0"
                value={newParty.openingBalance} 
                onChange={e => setNewParty({ ...newParty, openingBalance: e.target.value })}
              />
            </label>

            <label>
              બાકી પ્રકાર
              <select
                value={newParty.balanceType}
                onChange={e => setNewParty({ ...newParty, balanceType: e.target.value })}
              >
                <option value="dr">DR (ઉધાર - ગ્રાહક પાસેથી આપણે લેવાના)</option>
                <option value="cr">CR (જમા - સપ્લાયર/પેઢીને આપણે આપવાના)</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              ખાતેદાર સાચવો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Parties List Table */}
      <h2>ખાતેદાર યાદી ({filteredParties.length})</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>કોડ</th>
              <th>ટેગ (પ્રકાર)</th>
              <th>નામ / પેઢી</th>
              <th>મોબાઇલ</th>
              <th>ગામ / શહેર</th>
              <th>બાકી રકમ (Balance)</th>
              <th style={{ textAlign: 'center' }}>WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {filteredParties.map(p => {
              const tagInfo = getPartyTagInfo(p.partyType);
              const balNum = parseFloat(p.currentBalance) || 0;
              const isCr = (p.balanceType || '').toLowerCase() === 'cr';

              return (
                <tr key={p.id}>
                  <td><b>{p.code || 'PTY'}</b></td>
                  <td>
                    <span className={`party-tag-badge party-tag-${tagInfo.value}`}>
                      {tagInfo.badge}
                    </span>
                  </td>
                  <td>
                    <b>{p.name}</b>
                    {p.firmName && p.firmName !== p.name && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.firmName}</div>
                    )}
                  </td>
                  <td>{p.mobile || '—'}</td>
                  <td>{p.village || '—'}{p.taluka ? `, ${p.taluka}` : ''}</td>
                  <td style={{
                    fontWeight: '700',
                    color: balNum === 0 ? '#16a34a' : (isCr ? '#2563eb' : '#dc2626')
                  }}>
                    {balNum === 0 
                      ? '₹0 (સરભર)' 
                      : `₹${balNum.toLocaleString('en-IN')} ${isCr ? 'CR (જમા)' : 'DR (ઉધાર)'}`}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {p.mobile ? (
                      <button 
                        type="button"
                        className="secondary" 
                        style={{ padding: '3px 8px', fontSize: '0.8rem', color: '#15803d' }}
                        onClick={() => handleWhatsApp(p)}>
                        WhatsApp
                      </button>
                    ) : '—'}
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

export default FarmerMaster;
