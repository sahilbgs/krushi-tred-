import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  FileBarChart2, 
  Printer, 
  Calendar, 
  Filter, 
  ShoppingCart, 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight,
  Receipt,
  Truck
} from 'lucide-react';

export const Reports = ({ onOpenBill, initialTab }) => {
  const { companyName, sales, purchases, parties, stock } = useData();

  // Active Report Tab: 'purchases' | 'stock' | 'outstanding' | 'sales' | 'trucks'
  const [activeReportTab, setActiveReportTab] = useState(initialTab || 'purchases');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('all'); // all | farmer | market
  const [truckSearch, setTruckSearch] = useState('');
  const [truckViewMode, setTruckViewMode] = useState('summary'); // 'summary' | 'trips'
  const [expandedTruck, setExpandedTruck] = useState({});

  // 1. Filtered Purchases Report
  const filteredPurchases = purchases.filter(p => {
    if (filterStartDate && p.purchaseDate < filterStartDate) return false;
    if (filterEndDate && p.purchaseDate > filterEndDate) return false;
    if (purchaseTypeFilter !== 'all' && p.purchaseType !== purchaseTypeFilter) return false;
    return true;
  });

  const totalPurchaseNet = filteredPurchases.reduce((s, p) => s + (parseFloat(p.netTotal) || 0), 0);
  const totalPurchasePaid = filteredPurchases.reduce((s, p) => s + (parseFloat(p.paidAmount) || 0), 0);
  const totalPurchaseDue = filteredPurchases.reduce((s, p) => s + (parseFloat(p.dueAmount) || 0), 0);
  const totalPurchaseExpenses = filteredPurchases.reduce((s, p) => s + (parseFloat(p.totalExpenses) || 0), 0);

  // 2. Outstanding Receivables & Payables
  const receivables = parties.filter(p => (p.balanceType || '').toLowerCase() === 'dr' && parseFloat(p.currentBalance || 0) > 0);
  const payables = parties.filter(p => (p.balanceType || '').toLowerCase() === 'cr' && parseFloat(p.currentBalance || 0) > 0);
  const totalReceivable = receivables.reduce((s, p) => s + (parseFloat(p.currentBalance) || 0), 0);
  const totalPayable = payables.reduce((s, p) => s + (parseFloat(p.currentBalance) || 0), 0);

  // 3. Sales Report
  const filteredSales = sales.filter(s => {
    if (filterStartDate && s.billDate < filterStartDate) return false;
    if (filterEndDate && s.billDate > filterEndDate) return false;
    return true;
  });
  const totalSalesAmt = filteredSales.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);

  // 4. Truck & Transporter Trips Report Data
  const allTruckTrips = purchases
    .filter(p => {
      const tNo = (p.truckNo || p.truckNumber || '').toString().trim();
      const tOwner = (p.truckOwner || p.truckOwnerName || '').toString().trim();
      const hasTruck = tNo.length > 0 || tOwner.length > 0;
      if (!hasTruck) return false;
      if (filterStartDate && p.purchaseDate < filterStartDate) return false;
      if (filterEndDate && p.purchaseDate > filterEndDate) return false;
      return true;
    })
    .map(p => {
      const bags = p.items?.reduce((s, it) => s + (parseInt(it.bags) || 0), 0) || 0;
      const weightKg = p.items?.reduce((s, it) => s + (parseFloat(it.netWeightKg || it.qtyKg) || 0), 0) || 0;
      const man = p.items?.reduce((s, it) => s + (parseFloat(it.totalMan || it.qtyMan) || 0), 0) || 0;
      const varieties = p.items?.map(it => it.varietyName || it.productName).filter(Boolean).join(', ') || '—';
      const tNo = (p.truckNo || p.truckNumber || '').toString().trim().toUpperCase();
      const tOwner = (p.truckOwner || p.truckOwnerName || '').toString().trim();
      return {
        id: p.id,
        billNo: p.billNo || p.invoiceNo || '—',
        date: p.purchaseDate || p.date || '—',
        truckNo: tNo || 'વાહન નં. વિના',
        truckOwner: tOwner || 'સામાન્ય ટ્રાન્સપોર્ટ',
        partyName: p.partyName || p.firmName || '—',
        varietyName: varieties,
        bags,
        weightKg,
        man,
        netTotal: p.netTotal || 0
      };
    })
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  const truckGroupsMap = {};
  allTruckTrips.forEach(trip => {
    const key = trip.truckNo.toUpperCase();
    if (!truckGroupsMap[key]) {
      truckGroupsMap[key] = {
        truckNo: trip.truckNo,
        transporterName: trip.truckOwner !== 'ટ્રાન્સપોર્ટર વિના' ? trip.truckOwner : 'સામાન્ય ટ્રાન્સપોર્ટ',
        tripsCount: 0,
        totalBags: 0,
        totalKg: 0,
        totalMan: 0,
        latestDate: trip.date,
        trips: []
      };
    }
    truckGroupsMap[key].tripsCount += 1;
    truckGroupsMap[key].totalBags += trip.bags;
    truckGroupsMap[key].totalKg += trip.weightKg;
    truckGroupsMap[key].totalMan += trip.man;
    if (trip.date > truckGroupsMap[key].latestDate) {
      truckGroupsMap[key].latestDate = trip.date;
    }
    truckGroupsMap[key].trips.push(trip);
  });

  const truckGroups = Object.values(truckGroupsMap).sort((a, b) => b.tripsCount - a.tripsCount);

  const filteredTruckGroups = truckGroups.filter(g => {
    if (!truckSearch.trim()) return true;
    const q = truckSearch.toLowerCase();
    return g.truckNo.toLowerCase().includes(q) || g.transporterName.toLowerCase().includes(q);
  });

  const filteredTripsList = allTruckTrips.filter(t => {
    if (!truckSearch.trim()) return true;
    const q = truckSearch.toLowerCase();
    return t.truckNo.toLowerCase().includes(q) ||
           t.truckOwner.toLowerCase().includes(q) ||
           t.partyName.toLowerCase().includes(q) ||
           t.varietyName.toLowerCase().includes(q);
  });

  const totalTrucksCount = truckGroups.length;
  const totalFeraCount = allTruckTrips.length;
  const totalTruckBags = allTruckTrips.reduce((s, t) => s + t.bags, 0);
  const totalTruckMan = allTruckTrips.reduce((s, t) => s + t.man, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-body">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileBarChart2 size={24} />
            હિસાબી રિપોર્ટ્સ (Financial & Purchase Reports)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
            {companyName} • ખરીદી રજિસ્ટર, સ્ટોક પત્રક, લેવાના/આપવાના બાકી અને ખર્ચ સમરી
          </p>
        </div>

        <button className="btn btn-secondary no-print" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Printer size={18} />
          રિપોર્ટ પ્રિન્ટ કરો
        </button>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveReportTab('purchases')}
          style={{
            padding: '0.55rem 1.1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'purchases' ? '700' : '500',
            backgroundColor: activeReportTab === 'purchases' ? '#064e3b' : '#f1f5f9',
            color: activeReportTab === 'purchases' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
          <ShoppingCart size={16} />
          ખરીદી રજિસ્ટર (Purchase Report)
        </button>

        <button 
          onClick={() => setActiveReportTab('stock')}
          style={{
            padding: '0.55rem 1.1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'stock' ? '700' : '500',
            backgroundColor: activeReportTab === 'stock' ? '#064e3b' : '#f1f5f9',
            color: activeReportTab === 'stock' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
          <Boxes size={16} />
          સ્ટોક રજિસ્ટર (બોરી, KG & મણ)
        </button>

        <button 
          onClick={() => setActiveReportTab('outstanding')}
          style={{
            padding: '0.55rem 1.1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'outstanding' ? '700' : '500',
            backgroundColor: activeReportTab === 'outstanding' ? '#064e3b' : '#f1f5f9',
            color: activeReportTab === 'outstanding' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
          લેવાના / આપવાના બાકી (Outstanding)
        </button>

        <button 
          onClick={() => setActiveReportTab('sales')}
          style={{
            padding: '0.55rem 1.1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'sales' ? '700' : '500',
            backgroundColor: activeReportTab === 'sales' ? '#064e3b' : '#f1f5f9',
            color: activeReportTab === 'sales' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
          <Receipt size={16} />
          વેચાણ બિલ રિપોર્ટ
        </button>

        <button 
          onClick={() => setActiveReportTab('trucks')}
          style={{
            padding: '0.55rem 1.1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'trucks' ? '700' : '500',
            backgroundColor: activeReportTab === 'trucks' ? '#064e3b' : '#f1f5f9',
            color: activeReportTab === 'trucks' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
          <Truck size={16} />
          🚚 ટ્રક & ટ્રાન્સપોર્ટર ફેરા પત્રક
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="card no-print" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={16} color="#64748b" />
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>તારીખ પસંદ કરો:</span>
          <input 
            type="date" 
            className="form-control" 
            value={filterStartDate} 
            onChange={(e) => setFilterStartDate(e.target.value)} 
            style={{ width: '140px', padding: '0.35rem' }} 
          />
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>થી</span>
          <input 
            type="date" 
            className="form-control" 
            value={filterEndDate} 
            onChange={(e) => setFilterEndDate(e.target.value)} 
            style={{ width: '140px', padding: '0.35rem' }} 
          />
        </div>

        {activeReportTab === 'purchases' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>ખરીદી પ્રકાર:</span>
            <select
              className="form-control"
              value={purchaseTypeFilter}
              onChange={(e) => setPurchaseTypeFilter(e.target.value)}
              style={{ width: '140px', padding: '0.35rem' }}>
              <option value="all">બધા પ્રકાર</option>
              <option value="farmer">ખેડૂત ખરીદી</option>
              <option value="market">માર્કેટ પેઢી ખરીદી</option>
            </select>
          </div>
        )}

        {(filterStartDate || filterEndDate || purchaseTypeFilter !== 'all') && (
          <button 
            className="btn btn-secondary" 
            onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setPurchaseTypeFilter('all'); }} 
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
            ફિલ્ટર સાફ કરો
          </button>
        )}
      </div>

      {/* 1. Purchase Register Report */}
      {activeReportTab === 'purchases' && (
        <div>
          {/* Summary KPI Cards */}
          <div className="cards">
            <div className="metric">
              <span>કુલ ખરીદી (Net Total)</span>
              <b>₹{Math.round(totalPurchaseNet).toLocaleString('en-IN')}</b>
            </div>
            <div className="metric">
              <span>ચૂકવેલ રકમ (Paid)</span>
              <b style={{ color: '#15803d' }}>₹{Math.round(totalPurchasePaid).toLocaleString('en-IN')}</b>
            </div>
            <div className="metric">
              <span>બાકી રકમ (Due / Payable)</span>
              <b style={{ color: '#b91c1c' }}>₹{Math.round(totalPurchaseDue).toLocaleString('en-IN')}</b>
            </div>
            <div className="metric">
              <span>કુલ ખર્ચ (મજૂરી/કમિશન/બારદાન)</span>
              <b style={{ color: '#b45309' }}>₹{Math.round(totalPurchaseExpenses).toLocaleString('en-IN')}</b>
            </div>
          </div>

          {/* Table */}
          <div className="tablewrap">
            <table>
                <thead>
                  <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.8rem', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>તારીખ</th>
                    <th style={{ padding: '0.75rem' }}>બિલ નં</th>
                    <th style={{ padding: '0.75rem' }}>પ્રકાર</th>
                    <th style={{ padding: '0.75rem' }}>ખાતેદાર / પેઢી</th>
                    <th style={{ padding: '0.75rem' }}>ગામ / યાર્ડ</th>
                    <th style={{ padding: '0.75rem' }}>માલની જાત</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>બેગ</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>KG</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>મણ</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>ખર્ચ (₹)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net Total (₹)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>બાકી (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p, idx) => {
                    const totalBags = p.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
                    const totalKg = p.items?.reduce((s, it) => s + parseFloat(it.netWeightKg || 0), 0) || 0;
                    const totalMan = p.items?.reduce((s, it) => s + parseFloat(it.totalMan || 0), 0) || 0;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.7rem', color: '#475569' }}>{p.purchaseDate}</td>
                        <td 
                          style={{ padding: '0.7rem', fontWeight: '700', color: '#064e3b', cursor: onOpenBill ? 'pointer' : 'default' }}
                          onClick={() => onOpenBill && onOpenBill(p)}
                          title="બિલ પ્રિન્ટ કરો"
                        >
                          {p.billNo} 🖨️
                        </td>
                        <td style={{ padding: '0.7rem' }}>
                          <span className={`badge ${p.purchaseType === 'farmer' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                            {p.purchaseType === 'farmer' ? 'ખેડૂત' : 'માર્કેટ'}
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem', fontWeight: '600' }}>{p.partyName}</td>
                        <td style={{ padding: '0.7rem', color: '#64748b' }}>{p.village || '—'}</td>
                        <td style={{ padding: '0.7rem' }}>
                          {p.items?.map(it => it.varietyName).join(', ')}
                        </td>
                        <td style={{ padding: '0.7rem', textAlign: 'center' }}><b>{totalBags}</b></td>
                        <td style={{ padding: '0.7rem', textAlign: 'right' }}>{totalKg}</td>
                        <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '600', color: '#064e3b' }}>
                          {totalMan.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.7rem', textAlign: 'right', color: '#b45309' }}>
                          ₹{Math.round(p.totalExpenses || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700' }}>
                          ₹{Math.round(p.netTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.7rem', textAlign: 'right', color: p.dueAmount > 0 ? '#ea580c' : '#16a34a', fontWeight: '700' }}>
                          ₹{Math.round(p.dueAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#ecfdf5', fontWeight: '800', fontSize: '0.9rem', color: '#064e3b' }}>
                    <td colSpan={6} style={{ padding: '0.8rem' }}>કુલ સરવાળો</td>
                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                      {filteredPurchases.reduce((s, p) => s + (p.items?.reduce((is, it) => is + parseInt(it.bags || 0), 0) || 0), 0)} બેગ
                    </td>
                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                      {filteredPurchases.reduce((s, p) => s + (p.items?.reduce((is, it) => is + parseFloat(it.netWeightKg || 0), 0) || 0), 0)} KG
                    </td>
                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                      {filteredPurchases.reduce((s, p) => s + (p.items?.reduce((is, it) => is + parseFloat(it.totalMan || 0), 0) || 0), 0).toFixed(2)} મણ
                    </td>
                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                      ₹{Math.round(totalPurchaseExpenses).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                      ₹{Math.round(totalPurchaseNet).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                      ₹{Math.round(totalPurchaseDue).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
          </div>
        </div>
      )}

      {/* 2. Variety-Wise Stock Register */}
      {activeReportTab === 'stock' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.82rem', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>ક્રમ</th>
                  <th style={{ padding: '0.75rem' }}>બિયારણ જાત (Variety)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>૧ બેગ વજન</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>હાજર બેગ સ્ટોક</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>છૂટક KG</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ વજન (KG)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ મણ (KG÷20)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>છેલ્લો ખરીદ ભાવ (₹/મણ)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>અંદાજિત સ્ટોક કિંમત (₹)</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((stk, idx) => {
                  const estValue = (stk.totalMan || (stk.totalWeightKg / 20)) * (stk.lastPurchaseRate || 0);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0f172a' }}>{stk.varietyName}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{stk.bagWeightKg || 35} KG</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                          {stk.availableBags} બેગ
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>
                        {stk.availableLooseKg || 0} kg
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700' }}>
                        {stk.totalWeightKg} KG
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', color: '#064e3b' }}>
                        {Number(stk.totalMan || (stk.totalWeightKg / 20)).toFixed(2)} મણ
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        ₹{Number(stk.lastPurchaseRate || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800' }}>
                        ₹{Math.round(estValue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#ecfdf5', fontWeight: '800', fontSize: '0.9rem', color: '#064e3b' }}>
                  <td colSpan={3} style={{ padding: '0.8rem' }}>કુલ સ્ટોક સરવાળો (Total Stock)</td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                    {stock.reduce((s, it) => s + (parseInt(it.availableBags) || 0), 0)} બેગ
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                    {stock.reduce((s, it) => s + (parseFloat(it.availableLooseKg) || 0), 0).toFixed(2)} kg
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    {stock.reduce((s, it) => s + (parseFloat(it.totalWeightKg) || 0), 0).toLocaleString('en-IN')} KG
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    {stock.reduce((s, it) => s + (parseFloat(it.totalMan || (it.totalWeightKg / 20)) || 0), 0).toFixed(2)} મણ
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    ₹{Math.round(stock.reduce((s, it) => s + ((it.totalMan || (it.totalWeightKg / 20)) * (it.lastPurchaseRate || 0)), 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 3. Outstanding Receivables & Payables */}
      {activeReportTab === 'outstanding' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Receivables (લેવાના બાકી) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#064e3b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowDownLeft size={18} color="#059669" />
                  લેવાના બાકી (Outstanding Receivables - Debit)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ગ્રાહકો/ખેડૂતો પાસેથી લેવાની રકમ</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#064e3b' }}>
                ₹{totalReceivable.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {receivables.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>કોઈ લેણી રકમ બાકી નથી.</div>
              ) : (
                receivables.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.village || '—'} {r.mobile ? `• ${r.mobile}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: '#b91c1c', fontSize: '0.95rem' }}>
                        ₹{(parseFloat(r.currentBalance) || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>ઉધાર</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payables (આપવાના બાકી) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#9a3412', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowUpRight size={18} color="#ea580c" />
                  આપવાના બાકી (Outstanding Payables - Credit)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>માર્કેટ પેઢીઓ/વેપારીઓને ચૂકવવાની રકમ</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#9a3412' }}>
                ₹{totalPayable.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {payables.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>કોઈ ચૂકવણી બાકી નથી.</div>
              ) : (
                payables.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.village || '—'} {p.mobile ? `• ${p.mobile}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: '#ea580c', fontSize: '0.95rem' }}>
                        ₹{(parseFloat(p.currentBalance) || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>જમા</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. Sales Report */}
      {activeReportTab === 'sales' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.82rem', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>તારીખ</th>
                  <th style={{ padding: '0.75rem' }}>બિલ નં</th>
                  <th style={{ padding: '0.75rem' }}>ખેડૂતનું નામ</th>
                  <th style={{ padding: '0.75rem' }}>ગામ</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ રકમ (₹)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>જમા (₹)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>બાકી ઉધાર (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.7rem' }}>{s.billDate}</td>
                    <td 
                      style={{ padding: '0.7rem', fontWeight: '700', color: '#064e3b', cursor: onOpenBill ? 'pointer' : 'default' }}
                      onClick={() => onOpenBill && onOpenBill(s)}
                      title="બિલ પ્રિન્ટ કરો"
                    >
                      {s.billNo} 🖨️
                    </td>
                    <td style={{ padding: '0.7rem', fontWeight: '600' }}>{s.farmerName}</td>
                    <td style={{ padding: '0.7rem', color: '#64748b' }}>{s.farmerVillage || '—'}</td>
                    <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700' }}>
                      ₹{s.netAmount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.7rem', textAlign: 'right', color: '#16a34a' }}>
                      ₹{s.paidAmount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.7rem', textAlign: 'right', color: s.dueAmount > 0 ? '#ea580c' : '#16a34a', fontWeight: '700' }}>
                      ₹{s.dueAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Truck & Transporter Trips Report */}
      {activeReportTab === 'trucks' && (
        <div>
          {/* Top KPI Cards for Trucks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6', margin: 0 }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>કુલ નોંધાયેલ વાહન / ટ્રક</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e3a8a', marginTop: '0.2rem' }}>
                {totalTrucksCount} વાહન
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ટ્રાન્સપોર્ટરો સાથે</div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981', margin: 0 }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>કુલ ફેરા (Total Trips)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#064e3b', marginTop: '0.2rem' }}>
                {totalFeraCount} ફેરા
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>આવક ડિલિવરી</div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b', margin: 0 }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>કુલ આવેલ બોરી (Bags)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#78350f', marginTop: '0.2rem' }}>
                {totalTruckBags.toLocaleString('en-IN')} બોરી
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ગુણી આવક</div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8b5cf6', margin: 0 }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>કુલ વજન (મણ & KG)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#581c87', marginTop: '0.2rem' }}>
                {Math.round(totalTruckMan).toLocaleString('en-IN')} મણ
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({(totalTruckMan * 20).toLocaleString('en-IN')} KG)</div>
            </div>
          </div>

          {/* Sub Controls: View Mode & Search */}
          <div className="card no-print" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setTruckViewMode('summary')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontWeight: truckViewMode === 'summary' ? '700' : '500',
                  backgroundColor: truckViewMode === 'summary' ? '#064e3b' : '#ffffff',
                  color: truckViewMode === 'summary' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                🚛 ટ્રક વાઇઝ સમરી (ફેરા & બોરી)
              </button>
              <button
                type="button"
                onClick={() => setTruckViewMode('trips')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontWeight: truckViewMode === 'trips' ? '700' : '500',
                  backgroundColor: truckViewMode === 'trips' ? '#064e3b' : '#ffffff',
                  color: truckViewMode === 'trips' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                📋 તમામ ફેરા લિસ્ટ ({allTruckTrips.length})
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 ટ્રક નંબર અથવા ટ્રાન્સપોર્ટર શોધો..."
              value={truckSearch}
              onChange={e => setTruckSearch(e.target.value)}
              style={{ padding: '0.45rem 0.85rem', width: '280px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          {/* View 1: Truck-Wise Summary Table */}
          {truckViewMode === 'summary' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.82rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>ક્રમ</th>
                      <th style={{ padding: '0.75rem' }}>ટ્રક / વાહન નંબર</th>
                      <th style={{ padding: '0.75rem' }}>ટ્રાન્સપોર્ટર / માલિક</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>કુલ ફેરા (Trips)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ બોરી</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ વજન (મણ)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>છેલ્લો ફેરો</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>વિગત</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTruckGroups.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          કોઈ ટ્રક ફેરા ડેટા મળ્યો નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredTruckGroups.map((g, idx) => {
                        const isExp = expandedTruck[g.truckNo];
                        return (
                          <React.Fragment key={g.truckNo}>
                            <tr style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', backgroundColor: isExp ? '#f8fafc' : 'transparent' }}>
                              <td style={{ padding: '0.7rem' }}>{idx + 1}</td>
                              <td style={{ padding: '0.7rem', fontWeight: '800', color: '#1e3a8a' }}>
                                🚛 {g.truckNo}
                              </td>
                              <td style={{ padding: '0.7rem', fontWeight: '600' }}>
                                {g.transporterName}
                              </td>
                              <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
                                  🔄 {g.tripsCount} ફેરા
                                </span>
                              </td>
                              <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '800', color: '#78350f' }}>
                                {g.totalBags.toLocaleString('en-IN')} બોરી
                              </td>
                              <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700', color: '#581c87' }}>
                                {Math.round(g.totalMan).toLocaleString('en-IN')} મણ <small style={{ color: '#64748b' }}>({Math.round(g.totalKg)} kg)</small>
                              </td>
                              <td style={{ padding: '0.7rem', textAlign: 'center', color: '#64748b' }}>
                                {g.latestDate}
                              </td>
                              <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedTruck(prev => ({ ...prev, [g.truckNo]: !isExp }))}
                                  style={{
                                    padding: '3px 10px',
                                    fontSize: '0.75rem',
                                    borderRadius: '5px',
                                    border: '1px solid #059669',
                                    backgroundColor: isExp ? '#059669' : '#ecfdf5',
                                    color: isExp ? '#ffffff' : '#047857',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isExp ? '▲ બંધ' : '▼ ફેરા જુઓ'}
                                </button>
                              </td>
                            </tr>

                            {/* Sub-table of all trips for this truck */}
                            {isExp && (
                              <tr>
                                <td colSpan="8" style={{ padding: '0.5rem 1rem 1rem', backgroundColor: '#f1f5f9' }}>
                                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem' }}>
                                    <div style={{ fontWeight: '700', color: '#064e3b', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                      🚛 {g.truckNo} - તમામ ફેરાની તારીખવાર વિગત:
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                                          <th style={{ padding: '0.4rem 0.6rem' }}>ફેરા #</th>
                                          <th style={{ padding: '0.4rem 0.6rem' }}>તારીખ</th>
                                          <th style={{ padding: '0.4rem 0.6rem' }}>બિયારણ જાત</th>
                                          <th style={{ padding: '0.4rem 0.6rem' }}>કોનો માલ આવ્યો (માલિક)</th>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>બોરી</th>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>મણ</th>
                                          <th style={{ padding: '0.4rem 0.6rem' }}>બિલ નં.</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {g.trips.map((tr, tIdx) => (
                                          <tr key={tIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.4rem 0.6rem', fontWeight: 'bold', color: '#059669' }}>
                                              #{g.trips.length - tIdx}
                                            </td>
                                            <td style={{ padding: '0.4rem 0.6rem' }}>{tr.date}</td>
                                            <td style={{ padding: '0.4rem 0.6rem', fontWeight: '600' }}>{tr.varietyName}</td>
                                            <td style={{ padding: '0.4rem 0.6rem' }}>{tr.partyName}</td>
                                            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', color: '#b45309' }}>
                                              {tr.bags} બોરી
                                            </td>
                                            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>
                                              {Math.round(tr.man)} મણ
                                            </td>
                                            <td style={{ padding: '0.4rem 0.6rem', color: '#64748b' }}>{tr.billNo}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 2: Chronological Trips Register */}
          {truckViewMode === 'trips' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.82rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>તારીખ</th>
                      <th style={{ padding: '0.75rem' }}>ટ્રક / વાહન નં</th>
                      <th style={{ padding: '0.75rem' }}>ટ્રાન્સપોર્ટર</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>આવેલ બોરી</th>
                      <th style={{ padding: '0.75rem' }}>બિયારણ જાત</th>
                      <th style={{ padding: '0.75rem' }}>માલિક / ખેડૂત</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ વજન (મણ)</th>
                      <th style={{ padding: '0.75rem' }}>બિલ નં</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTripsList.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          કોઈ ફેરા એન્ટ્રી મળી નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredTripsList.map((tr, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.7rem' }}>{tr.date}</td>
                          <td style={{ padding: '0.7rem', fontWeight: '800', color: '#1e3a8a' }}>
                            🚛 {tr.truckNo}
                          </td>
                          <td style={{ padding: '0.7rem', fontWeight: '600' }}>{tr.truckOwner}</td>
                          <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                              📦 {tr.bags} બોરી
                            </span>
                          </td>
                          <td style={{ padding: '0.7rem', fontWeight: '600' }}>{tr.varietyName}</td>
                          <td style={{ padding: '0.7rem' }}>{tr.partyName}</td>
                          <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: '700' }}>
                            {Math.round(tr.man)} મણ
                          </td>
                          <td style={{ padding: '0.7rem', color: '#64748b' }}>{tr.billNo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
