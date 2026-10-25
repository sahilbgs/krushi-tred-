import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  Printer, 
  Phone, 
  MapPin, 
  Calendar, 
  Wallet, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2, 
  X, 
  Building2, 
  UserCheck, 
  Truck, 
  Users, 
  Coins,
  FileText
} from 'lucide-react';

export const KhataBook = () => {
  const { 
    companyName, 
    parties, 
    partyTransactions, 
    rojmel, 
    seeds, 
    addParty, 
    recordVoucher 
  } = useData();

  // Top Tabs: 'ledger' (ખાતાવહી) | 'rojmel' (રોજમેળ)
  const [activeMainTab, setActiveMainTab] = useState('ledger');

  // Party Type Filter for Selector: 'all' | 'farmer' | 'firm' | 'trader' | 'truck_owner'
  const [partyTypeFilter, setPartyTypeFilter] = useState('all');
  const [partySearch, setPartySearch] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState(() => parties[0]?.id || '');

  // Ledger Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState('all');
  const [varietyFilter, setVarietyFilter] = useState('all');

  // Rojmel Date
  const [rojmelDate, setRojmelDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal States
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherType, setVoucherType] = useState('receipt'); // receipt | payment | journal | return | expense
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);

  // New Voucher Form State
  const [voucherForm, setVoucherForm] = useState({
    amount: '',
    paymentMode: 'cash',
    remarks: '',
    varietyName: '',
    bags: '',
    weightKg: '',
    ratePerMan: ''
  });

  // Quick Party Form
  const [newPartyForm, setNewPartyForm] = useState({
    partyType: 'farmer',
    name: '',
    firmName: '',
    firmId: '',
    mobile: '',
    village: '',
    openingBalance: 0,
    balanceType: 'dr'
  });

  // Filtered Parties List for sidebar selector
  const filteredParties = useMemo(() => {
    return parties.filter(p => {
      const matchType = partyTypeFilter === 'all' || p.partyType === partyTypeFilter;
      const q = partySearch.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) ||
                          (p.firmName && p.firmName.toLowerCase().includes(q)) ||
                          (p.mobile && p.mobile.includes(q)) ||
                          (p.village && p.village.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [parties, partyTypeFilter, partySearch]);

  const selectedParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  // Transactions for selected Party
  const partyLedgerTransactions = useMemo(() => {
    if (!selectedParty) return [];
    return partyTransactions.filter(tx => {
      if (tx.partyId !== selectedParty.id) return false;
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      if (voucherTypeFilter !== 'all' && tx.voucherType !== voucherTypeFilter) return false;
      if (varietyFilter !== 'all' && !tx.varietyName.includes(varietyFilter)) return false;
      return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)); // chronological order for ledger
  }, [partyTransactions, selectedParty, startDate, endDate, voucherTypeFilter, varietyFilter]);

  // Compute Running Balance for selected party
  // Debit increases customer dues (for farmers), Credit decreases dues / pays
  // For suppliers/firms: Credit increases what we owe them, Debit decreases it
  const transactionsWithRunningBalance = useMemo(() => {
    if (!selectedParty) return [];
    let current = selectedParty.openingBalance || 0;
    const isSupplierOrFirm = selectedParty.partyType === 'firm' || selectedParty.partyType === 'trader';

    return partyLedgerTransactions.map(tx => {
      const dr = parseFloat(tx.debit || 0);
      const cr = parseFloat(tx.credit || 0);

      if (isSupplierOrFirm) {
        // Firm: Credit = goods inward (payable increases), Debit = money paid to firm (payable decreases)
        current = current + cr - dr;
      } else {
        // Farmer / Customer: Debit = goods sold (receivable increases), Credit = payment received / purchase from farmer
        current = current + dr - cr;
      }

      return {
        ...tx,
        runningBalance: Math.abs(current),
        runningBalanceType: current >= 0 ? (isSupplierOrFirm ? 'Cr' : 'Dr') : (isSupplierOrFirm ? 'Dr' : 'Cr')
      };
    });
  }, [partyLedgerTransactions, selectedParty]);

  // Ledger Summary Totals
  const totalDebit = partyLedgerTransactions.reduce((s, tx) => s + (parseFloat(tx.debit) || 0), 0);
  const totalCredit = partyLedgerTransactions.reduce((s, tx) => s + (parseFloat(tx.credit) || 0), 0);
  const totalBagsTransacted = partyLedgerTransactions.reduce((s, tx) => s + (parseInt(tx.bags) || 0), 0);
  const totalWeightTransacted = partyLedgerTransactions.reduce((s, tx) => s + (parseFloat(tx.weightKg) || 0), 0);

  // Daily Rojmel Transactions
  const filteredRojmel = useMemo(() => {
    return rojmel.filter(r => r.date === rojmelDate)
                 .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [rojmel, rojmelDate]);

  const rojmelTotalCredit = filteredRojmel.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);
  const rojmelTotalDebit = filteredRojmel.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);

  // Handle Voucher Save
  const handleSaveVoucher = (e) => {
    e.preventDefault();
    if (!voucherForm.amount || parseFloat(voucherForm.amount) <= 0) return;

    recordVoucher({
      type: voucherType,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      amount: parseFloat(voucherForm.amount),
      paymentMode: voucherForm.paymentMode,
      remarks: voucherForm.remarks || (voucherType === 'receipt' ? 'રોકડ/બેંક રકમ જમા' : 'ચુકવણી વાઉચર'),
      varietyName: voucherForm.varietyName || '—',
      bags: parseInt(voucherForm.bags || 0),
      weightKg: parseFloat(voucherForm.weightKg || 0),
      ratePerMan: parseFloat(voucherForm.ratePerMan || 0)
    });

    setShowVoucherModal(false);
    setVoucherForm({
      amount: '',
      paymentMode: 'cash',
      remarks: '',
      varietyName: '',
      bags: '',
      weightKg: '',
      ratePerMan: ''
    });
  };

  // Quick Party Save
  const handleSaveQuickParty = (e) => {
    e.preventDefault();
    if (!newPartyForm.name) return;

    const created = addParty({
      partyType: newPartyForm.partyType,
      name: newPartyForm.name,
      firmName: newPartyForm.firmName,
      firmId: newPartyForm.firmId,
      mobile: newPartyForm.mobile,
      village: newPartyForm.village,
      openingBalance: parseFloat(newPartyForm.openingBalance || 0),
      balanceType: newPartyForm.balanceType
    });

    setSelectedPartyId(created.id);
    setShowAddPartyModal(false);
    setNewPartyForm({
      partyType: 'farmer',
      name: '',
      firmName: '',
      firmId: '',
      mobile: '',
      village: '',
      openingBalance: 0,
      balanceType: 'dr'
    });
  };

  // Print current active view
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Statement
  const handleWhatsAppStatement = () => {
    if (!selectedParty?.mobile) {
      alert("ખાતેદારનો મોબાઇલ નંબર ઉપલબ્ધ નથી.");
      return;
    }
    const cleanMobile = selectedParty.mobile.replace(/\D/g, '');
    const fullMobile = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;

    const msg = `*🌱 ${companyName} - ખાતાવહી હિસાબ*%0A` +
      `તારીખ: ${new Date().toLocaleDateString('gu-IN')}%0A` +
      `ખાતેદાર: ${selectedParty.name}%0A` +
      `ગામ: ${selectedParty.village || '—'}%0A` +
      `--------------------------------%0A` +
      `કુલ ઉધાર (Debit): ₹${totalDebit.toLocaleString('en-IN')}%0A` +
      `કુલ જમા (Credit): ₹${totalCredit.toLocaleString('en-IN')}%0A` +
      `*👉 ચોખ્ખું બેલેન્સ: ₹${(selectedParty.currentBalance || 0).toLocaleString('en-IN')} ${selectedParty.balanceType?.toUpperCase() || ''}*%0A` +
      `--------------------------------%0A` +
      `આભાર! 🙏`;

    window.open(`https://wa.me/${fullMobile}?text=${msg}`, '_blank');
  };

  return (
    <div className="page-body">
      
      {/* Top Header & Mode Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={24} color="#059669" />
            ખાતાવહી & રોજમેળ મોડ્યુલ (Ledger & Day Book)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
            {companyName} • ખેડૂત, વેપારી, પેઢી અને રોકડ/બેંકનો સંપૂર્ણ હિસાબ
          </p>
        </div>

        {/* Main Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#ffffff', padding: '0.35rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveMainTab('ledger')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeMainTab === 'ledger' ? '#064e3b' : 'transparent',
              color: activeMainTab === 'ledger' ? '#ffffff' : '#64748b'
            }}>
            <FileText size={17} />
            ખાતાવહી (Party Ledger)
          </button>

          <button
            onClick={() => setActiveMainTab('rojmel')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeMainTab === 'rojmel' ? '#064e3b' : 'transparent',
              color: activeMainTab === 'rojmel' ? '#ffffff' : '#64748b'
            }}>
            <Calendar size={17} />
            રોજમેળ (Daily Rojmel)
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. KHATAVAHI / PARTY LEDGER VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'ledger' && (
        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '1.25rem' }}>
          
          {/* Left Column: Party Selector List */}
          <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#064e3b' }}>ખાતેદાર પસંદ કરો</span>
              <button
                onClick={() => setShowAddPartyModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                + નવો
              </button>
            </div>

            {/* Type Filters */}
            <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', marginBottom: '0.75rem' }}>
              {[
                { id: 'all', label: 'બધા' },
                { id: 'farmer', label: 'ખેડૂત' },
                { id: 'firm', label: 'પેઢી' },
                { id: 'trader', label: 'વેપારી' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setPartyTypeFilter(t.id)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: partyTypeFilter === t.id ? '700' : '500',
                    backgroundColor: partyTypeFilter === t.id ? '#059669' : '#f1f5f9',
                    color: partyTypeFilter === t.id ? '#ffffff' : '#475569'
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                placeholder="નામ/ગામ/મોબાઇલ શોધો..."
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                style={{ paddingLeft: '2rem', fontSize: '0.82rem' }}
              />
            </div>

            {/* Party List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '560px', overflowY: 'auto' }}>
              {filteredParties.map(p => {
                const isSelected = selectedParty?.id === p.id;
                const isFarmer = p.partyType === 'farmer';
                const isFirm = p.partyType === 'firm';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPartyId(p.id)}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #059669' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: isSelected ? '#064e3b' : '#0f172a' }}>
                        {p.name}
                      </span>
                      <span className={`badge ${isFarmer ? 'badge-primary' : isFirm ? 'badge-warning' : 'badge-secondary'}`} style={{ fontSize: '0.65rem' }}>
                        {isFarmer ? 'ખેડૂત' : isFirm ? 'પેઢી' : 'વેપારી'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem' }}>
                      <span>{p.village || '—'}</span>
                      <span style={{ fontWeight: '700', color: p.currentBalance > 0 ? (isFarmer ? '#dc2626' : '#ea580c') : '#16a34a' }}>
                        ₹{(p.currentBalance || 0).toLocaleString('en-IN')} {p.balanceType?.toUpperCase() || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Complete Party Ledger Details */}
          <div>
            
            {/* Party Header Banner */}
            {selectedParty && (
              <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${selectedParty.partyType === 'farmer' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                        {selectedParty.partyType === 'farmer' ? 'ખેડૂત ખાતું' : selectedParty.partyType === 'firm' ? 'માર્કેટ પેઢી ખાતું' : 'વેપારી ખાતું'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>કોડ: {selectedParty.code}</span>
                    </div>

                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#064e3b', margin: '0.3rem 0 0.15rem' }}>
                      {selectedParty.name}
                    </h3>
                    {selectedParty.firmName && (
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        જોડાયેલ પેઢી: <b>{selectedParty.firmName}</b>
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <MapPin size={14} /> {selectedParty.village || 'ગામ દર્શાવેલ નથી'}
                      {selectedParty.mobile && (
                        <span style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={13} /> {selectedParty.mobile}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Balance */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #059669',
                      padding: '0.6rem 1rem',
                      borderRadius: '10px',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                        ચોખ્ખું બાકી બેલેન્સ
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: (selectedParty.currentBalance || 0) > 0 ? '#b91c1c' : '#15803d' }}>
                        ₹{(selectedParty.currentBalance || 0).toLocaleString('en-IN')}
                        <span style={{ fontSize: '0.85rem', marginLeft: '0.3rem', color: '#64748b' }}>
                          {selectedParty.balanceType?.toUpperCase() || ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setVoucherType('receipt'); setShowVoucherModal(true); }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ArrowDownLeft size={16} />
                        + જમા (Receipt)
                      </button>

                      <button
                        onClick={() => { setVoucherType('payment'); setShowVoucherModal(true); }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ArrowUpRight size={16} />
                        - ચુકવણી (Payment)
                      </button>

                      <button
                        onClick={handleWhatsAppStatement}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', color: '#16a34a', borderColor: '#86efac' }}>
                        WhatsApp
                      </button>

                      <button
                        onClick={handlePrint}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>
                        <Printer size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ledger Filter Bar */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} color="#64748b" />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>તારીખ:</span>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: '130px' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>થી</span>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: '130px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Filter size={14} color="#64748b" />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>પ્રકાર:</span>
                    <select
                      className="form-control"
                      value={voucherTypeFilter}
                      onChange={(e) => setVoucherTypeFilter(e.target.value)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: '120px' }}>
                      <option value="all">બધા વ્યવહાર</option>
                      <option value="purchase">ખરીદી (Purchase)</option>
                      <option value="sale">વેચાણ (Sale)</option>
                      <option value="receipt">પાવતી (Receipt)</option>
                      <option value="payment">ચુકવણી (Payment)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>જાત:</span>
                    <select
                      className="form-control"
                      value={varietyFilter}
                      onChange={(e) => setVarietyFilter(e.target.value)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: '130px' }}>
                      <option value="all">તમામ જાતો</option>
                      {seeds.map(s => (
                        <option key={s.id} value={s.varietyName}>{s.varietyName.split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>

                  {(startDate || endDate || voucherTypeFilter !== 'all' || varietyFilter !== 'all') && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); setVoucherTypeFilter('all'); setVarietyFilter('all'); }}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                      ફિલ્ટર હટાવો
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Complete Chronological Party Ledger Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.8rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>તારીખ</th>
                      <th style={{ padding: '0.75rem' }}>વાઉચર નં</th>
                      <th style={{ padding: '0.75rem' }}>વિગત (Particulars)</th>
                      <th style={{ padding: '0.75rem' }}>માલની જાત</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>બેગ</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ KG</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>મણ</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>ભાવ (₹/મણ)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#043729' }}>Debit / ઉધાર</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#043729' }}>Credit / જમા</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#022c22' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Row */}
                    {selectedParty?.openingBalance > 0 && (
                      <tr style={{ backgroundColor: '#f8fafc', fontSize: '0.85rem', fontStyle: 'italic', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.7rem' }}>—</td>
                        <td style={{ padding: '0.7rem' }}>OPN-BAL</td>
                        <td style={{ padding: '0.7rem', fontWeight: '600' }}>શરૂઆતનું જૂનું બેલેન્સ (Opening Balance)</td>
                        <td style={{ padding: '0.7rem' }}>—</td>
                        <td style={{ padding: '0.7rem', textAlign: 'center' }}>—</td>
                        <td style={{ padding: '0.7rem', textAlign: 'right' }}>—</td>
                        <td style={{ padding: '0.7rem', textAlign: 'right' }}>—</td>
                        <td style={{ padding: '0.7rem', textAlign: 'right' }}>—</td>
                        <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                          {selectedParty.balanceType === 'dr' ? `₹${selectedParty.openingBalance.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                          {selectedParty.balanceType === 'cr' ? `₹${selectedParty.openingBalance.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '800' }}>
                          ₹{selectedParty.openingBalance.toLocaleString('en-IN')} {selectedParty.balanceType?.toUpperCase()}
                        </td>
                      </tr>
                    )}

                    {transactionsWithRunningBalance.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                          આ ખાતેદારના ખાતામાં પસંદ કરેલા સમયગાળામાં કોઈ વ્યવહાર નથી.
                        </td>
                      </tr>
                    ) : (
                      transactionsWithRunningBalance.map((tx, idx) => {
                        const isDr = tx.debit > 0;
                        const isCr = tx.credit > 0;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                            <td style={{ padding: '0.7rem', whiteSpace: 'nowrap', color: '#475569' }}>
                              {tx.date}
                            </td>
                            <td style={{ padding: '0.7rem', fontWeight: '700', color: '#064e3b', whiteSpace: 'nowrap' }}>
                              {tx.voucherNo}
                            </td>
                            <td style={{ padding: '0.7rem', color: '#1e293b' }}>
                              <span style={{ fontWeight: '600' }}>{tx.particulars}</span>
                              {tx.remarks && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{tx.remarks}</div>}
                            </td>
                            <td style={{ padding: '0.7rem', color: '#475569' }}>
                              {tx.varietyName || '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                              {tx.bags > 0 ? <b>{tx.bags}</b> : '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                              {tx.weightKg > 0 ? `${tx.weightKg} kg` : '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '600', color: '#064e3b' }}>
                              {tx.totalMan > 0 ? `${tx.totalMan}` : '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                              {tx.ratePerMan > 0 ? `₹${tx.ratePerMan}` : '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700', color: isDr ? '#b91c1c' : '#94a3b8' }}>
                              {isDr ? `₹${tx.debit.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700', color: isCr ? '#15803d' : '#94a3b8' }}>
                              {isCr ? `₹${tx.credit.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                              ₹{tx.runningBalance.toLocaleString('en-IN')} {tx.runningBalanceType}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#ecfdf5', fontWeight: '800', fontSize: '0.88rem', color: '#064e3b' }}>
                      <td colSpan={4} style={{ padding: '0.8rem' }}>કુલ સરવાળો (Total)</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center' }}>{totalBagsTransacted} બેગ</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>{totalWeightTransacted} KG</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>{(totalWeightTransacted / 20).toFixed(2)} મણ</td>
                      <td></td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', color: '#b91c1c' }}>
                        ₹{totalDebit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', color: '#15803d' }}>
                        ₹{totalCredit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                        ₹{(selectedParty?.currentBalance || 0).toLocaleString('en-IN')} {selectedParty?.balanceType?.toUpperCase()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DAILY ROJMEL / DAY BOOK VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'rojmel' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          
          {/* Rojmel Controls & Date Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.2rem' }}>રોજમેળ તારીખ પસંદ કરો:</label>
                <input
                  type="date"
                  className="form-control"
                  value={rojmelDate}
                  onChange={(e) => setRojmelDate(e.target.value)}
                  style={{ fontWeight: '700', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>કંપનીનું નામ:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#064e3b' }}>
                  {companyName}
                </div>
              </div>
            </div>

            {/* Quick Stats on Selected Day */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: '700' }}>આજના દિવસની જમા (Credit)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#166534' }}>
                  ₹{rojmelTotalCredit.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: '700' }}>આજના દિવસની ઉધાર (Debit)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#991b1b' }}>
                  ₹{rojmelTotalDebit.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                <Printer size={16} />
                રોજમેળ પ્રિન્ટ કરો
              </button>
            </div>
          </div>

          {/* Rojmel Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.82rem', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>સમય</th>
                  <th style={{ padding: '0.75rem' }}>વાઉચર નં</th>
                  <th style={{ padding: '0.75rem' }}>પ્રકાર</th>
                  <th style={{ padding: '0.75rem' }}>ખાતેદાર</th>
                  <th style={{ padding: '0.75rem' }}>વિગત</th>
                  <th style={{ padding: '0.75rem' }}>માલની જાત</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>બેગ</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>KG</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>મણ</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#043729' }}>જમા (Credit / આવક)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#043729' }}>ઉધાર (Debit / જાવક)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>ખાતું/Mode</th>
                </tr>
              </thead>
              <tbody>
                {filteredRojmel.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.95rem' }}>
                      તારીખ {rojmelDate} ના રોજ કોઈ વાઉચર કે ખરીદ-વેચાણ વ્યવહાર નોંધાયેલ નથી.
                    </td>
                  </tr>
                ) : (
                  filteredRojmel.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.7rem', color: '#64748b' }}>{r.time || '—'}</td>
                      <td style={{ padding: '0.7rem', fontWeight: '700', color: '#064e3b' }}>{r.voucherNo}</td>
                      <td style={{ padding: '0.7rem' }}>
                        <span className={`badge ${r.voucherType === 'purchase' ? 'badge-primary' : r.voucherType === 'sale' ? 'badge-warning' : 'badge-secondary'}`} style={{ fontSize: '0.7rem' }}>
                          {r.voucherType === 'purchase' ? 'ખરીદી' : r.voucherType === 'sale' ? 'વેચાણ' : r.voucherType === 'receipt' ? 'જમા' : 'ચુકવણી'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem', fontWeight: '600' }}>{r.partyName}</td>
                      <td style={{ padding: '0.7rem', color: '#1e293b' }}>{r.particulars}</td>
                      <td style={{ padding: '0.7rem', color: '#475569' }}>{r.varietyName || '—'}</td>
                      <td style={{ padding: '0.7rem', textAlign: 'center' }}>{r.bags > 0 ? r.bags : '—'}</td>
                      <td style={{ padding: '0.7rem', textAlign: 'right' }}>{r.weightKg > 0 ? r.weightKg : '—'}</td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '600', color: '#064e3b' }}>
                        {r.totalMan > 0 ? r.totalMan : '—'}
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700', color: r.credit > 0 ? '#15803d' : '#94a3b8' }}>
                        {r.credit > 0 ? `₹${r.credit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700', color: r.debit > 0 ? '#b91c1c' : '#94a3b8' }}>
                        {r.debit > 0 ? `₹${r.debit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>{r.paymentMode}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#ecfdf5', fontWeight: '800', fontSize: '0.9rem', color: '#064e3b' }}>
                  <td colSpan={9} style={{ padding: '0.8rem' }}>દિવસનો કુલ હિસાબ (Daily Summary)</td>
                  <td style={{ padding: '0.8rem', textAlign: 'right', color: '#15803d' }}>
                    ₹{rojmelTotalCredit.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'right', color: '#b91c1c' }}>
                    ₹{rojmelTotalDebit.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* VOUCHER ENTRY MODAL (Receipt, Payment, Journal) */}
      {/* ========================================================= */}
      {showVoucherModal && selectedParty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                {voucherType === 'receipt' ? 'જમા પાવતી (Receipt / પૈસા મળ્યા)' : 'ચુકવણી વાઉચર (Payment / પૈસા આપ્યા)'}
              </h3>
              <button onClick={() => setShowVoucherModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              <div>ખાતેદારનું નામ: <b>{selectedParty.name}</b></div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                હાલનું બાકી બેલેન્સ: <b>₹{(selectedParty.currentBalance || 0).toLocaleString('en-IN')} {selectedParty.balanceType?.toUpperCase()}</b>
              </div>
            </div>

            <form onSubmit={handleSaveVoucher}>
              <div className="form-group">
                <label className="form-label">રકમ (₹ Amount) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-control"
                  placeholder="દા.ત. 15000"
                  value={voucherForm.amount}
                  onChange={(e) => setVoucherForm(prev => ({ ...prev, amount: e.target.value }))}
                  style={{ fontSize: '1.15rem', fontWeight: '700', color: '#064e3b' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ચુકવણી પ્રકાર (Payment Mode)</label>
                <select
                  className="form-control"
                  value={voucherForm.paymentMode}
                  onChange={(e) => setVoucherForm(prev => ({ ...prev, paymentMode: e.target.value }))}>
                  <option value="cash">રોકડ (Cash)</option>
                  <option value="bank">બેંક ટ્રાન્સફર / NEFT / Cheque</option>
                  <option value="upi">UPI / Google Pay / PhonePe</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">વિગત / નોંધ (Remarks)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="દા.ત. જૂના બિલ પેટે રકમ જમા કરી"
                  value={voucherForm.remarks}
                  onChange={(e) => setVoucherForm(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVoucherModal(false)}>
                  રદ કરો
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontWeight: '700' }}>
                  વાઉચર સેવ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PARTY MODAL */}
      {showAddPartyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#064e3b', margin: 0 }}>
                + નવો ખાતેદાર (Party Master)
              </h3>
              <button onClick={() => setShowAddPartyModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickParty}>
              <div className="form-group">
                <label className="form-label">ખાતેદાર પ્રકાર *</label>
                <select
                  className="form-control"
                  value={newPartyForm.partyType}
                  onChange={(e) => setNewPartyForm(prev => ({ ...prev, partyType: e.target.value, balanceType: e.target.value === 'farmer' ? 'dr' : 'cr' }))}>
                  <option value="farmer">ખેડૂત (Farmer)</option>
                  <option value="firm">માર્કેટ પેઢી (Firm / Pethi)</option>
                  <option value="trader">વેપારી (Trader)</option>
                  <option value="truck_owner">ટ્રક માલિક (Truck Owner)</option>
                  <option value="other">અન્ય (Other)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ખાતેદારનું નામ *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="નામ દાખલ કરો"
                  value={newPartyForm.name}
                  onChange={(e) => setNewPartyForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {newPartyForm.partyType === 'trader' && (
                <div className="form-group">
                  <label className="form-label">પેઢીનું નામ (Firm Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="દા.ત. શ્રી ગણેશ ટ્રેડિંગ કંપની"
                    value={newPartyForm.firmName}
                    onChange={(e) => setNewPartyForm(prev => ({ ...prev, firmName: e.target.value }))}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ગામ / સરનામું</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ગામ"
                    value={newPartyForm.village}
                    onChange={(e) => setNewPartyForm(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">મોબાઇલ નંબર</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="૧૦ આંકડાનો મોબાઇલ"
                    value={newPartyForm.mobile}
                    onChange={(e) => setNewPartyForm(prev => ({ ...prev, mobile: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">જૂનું બાકી (Opening Balance ₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={newPartyForm.openingBalance}
                    onChange={(e) => setNewPartyForm(prev => ({ ...prev, openingBalance: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">બેલેન્સ પ્રકાર</label>
                  <select
                    className="form-control"
                    value={newPartyForm.balanceType}
                    onChange={(e) => setNewPartyForm(prev => ({ ...prev, balanceType: e.target.value }))}>
                    <option value="dr">ઉધાર (Dr - લેવાના)</option>
                    <option value="cr">જમા (Cr - આપવાના)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPartyModal(false)}>
                  રદ કરો
                </button>
                <button type="submit" className="btn btn-primary">
                  ખાતું બનાવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
