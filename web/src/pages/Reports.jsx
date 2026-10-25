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
  Receipt
} from 'lucide-react';

export const Reports = ({ onOpenBill }) => {
  const { companyName, sales, purchases, parties, stock } = useData();

  // Active Report Tab: 'purchases' | 'stock' | 'outstanding' | 'sales'
  const [activeReportTab, setActiveReportTab] = useState('purchases');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('all'); // all | farmer | market

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
  const receivables = parties.filter(p => p.balanceType === 'dr' && p.currentBalance > 0);
  const payables = parties.filter(p => p.balanceType === 'cr' && p.currentBalance > 0);
  const totalReceivable = receivables.reduce((s, p) => s + (p.currentBalance || 0), 0);
  const totalPayable = payables.reduce((s, p) => s + (p.currentBalance || 0), 0);

  // 3. Sales Report
  const filteredSales = sales.filter(s => {
    if (filterStartDate && s.billDate < filterStartDate) return false;
    if (filterEndDate && s.billDate > filterEndDate) return false;
    return true;
  });
  const totalSalesAmt = filteredSales.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #064e3b' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>કુલ ખરીદી (Net Total)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#064e3b', marginTop: '0.2rem' }}>
                ₹{Math.round(totalPurchaseNet).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>ચૂકવેલ રકમ (Paid)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', marginTop: '0.2rem' }}>
                ₹{Math.round(totalPurchasePaid).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ea580c' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>બાકી રકમ (Due / Payable)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ea580c', marginTop: '0.2rem' }}>
                ₹{Math.round(totalPurchaseDue).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #b45309' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>કુલ ખર્ચ (મજૂરી/કમિશન/બારદાન)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b45309', marginTop: '0.2rem' }}>
                ₹{Math.round(totalPurchaseExpenses).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                        <td style={{ padding: '0.7rem', fontWeight: '700', color: '#064e3b' }}>{p.billNo}</td>
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
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>35 KG</td>
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
                        ₹{r.currentBalance.toLocaleString('en-IN')}
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
                        ₹{p.currentBalance.toLocaleString('en-IN')}
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
                    <td style={{ padding: '0.7rem', fontWeight: '700', color: '#064e3b' }}>{s.billNo}</td>
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

    </div>
  );
};
