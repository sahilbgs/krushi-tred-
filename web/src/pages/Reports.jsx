import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { FileBarChart2, Printer, MessageCircle, Calendar, Filter } from 'lucide-react';

export const Reports = ({ onOpenBill }) => {
  const { sales, farmers, stock } = useData();

  const [activeReportTab, setActiveReportTab] = useState('sales'); // sales | variety | udhar
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // 1. Sales Report
  const filteredSales = sales.filter(s => {
    if (filterStartDate && s.billDate < filterStartDate) return false;
    if (filterEndDate && s.billDate > filterEndDate) return false;
    return true;
  });

  const totalFilteredSalesAmt = filteredSales.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);
  const totalFilteredPaidAmt = filteredSales.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalFilteredDueAmt = filteredSales.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);

  // 2. Variety-wise aggregation
  const varietyMap = {};
  filteredSales.forEach(s => {
    s.items.forEach(it => {
      if (!varietyMap[it.varietyName]) {
        varietyMap[it.varietyName] = {
          name: it.varietyName,
          bags: 0,
          looseKg: 0,
          totalKg: 0,
          totalAmount: 0
        };
      }
      varietyMap[it.varietyName].bags += parseInt(it.bags || 0);
      varietyMap[it.varietyName].looseKg += parseFloat(it.looseKg || 0);
      varietyMap[it.varietyName].totalKg += parseFloat(it.totalWeightKg || 0);
      varietyMap[it.varietyName].totalAmount += parseFloat(it.itemTotal || 0);
    });
  });
  const varietyReports = Object.values(varietyMap);

  // 3. Udhar (Due) Report
  const farmersWithDue = farmers.filter(f => f.currentBalance > 0);
  const totalOutstanding = farmersWithDue.reduce((acc, f) => acc + f.currentBalance, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppAlert = (farmer) => {
    if (!farmer.mobile) return;
    const cleanMobile = farmer.mobile.replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    const msg = `નમસ્તે શ્રી ${farmer.name}, કૃષિ ટ્રેડ તરફથી આપના ખાતાની બાકી રકમ ₹${farmer.currentBalance} છે. કૃપા કરીને અનુકૂળતા મુજબ જમા કરાવવા વિનંતી. આભાર!`;
    window.open(`https://wa.me/${mobileWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileBarChart2 size={24} />
            હિસાબી રિપોર્ટ્સ (Financial & Sales Reports)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            વેચાણ વિશ્લેષણ, બિયારણ જાત વાઇઝ રિપોર્ટ અને બાકી ઉધાર યાદી
          </p>
        </div>

        <button className="btn btn-secondary no-print" onClick={handlePrint}>
          <Printer size={18} />
          રિપોર્ટ પ્રિન્ટ કરો
        </button>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveReportTab('sales')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'sales' ? '600' : '500',
            backgroundColor: activeReportTab === 'sales' ? '#059669' : '#f1f5f9',
            color: activeReportTab === 'sales' ? '#ffffff' : '#475569'
          }}>
          વેચાણ બિલ રિપોર્ટ
        </button>

        <button 
          onClick={() => setActiveReportTab('variety')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'variety' ? '600' : '500',
            backgroundColor: activeReportTab === 'variety' ? '#059669' : '#f1f5f9',
            color: activeReportTab === 'variety' ? '#ffffff' : '#475569'
          }}>
          બિયારણ જાત વાઇઝ વેચાણ
        </button>

        <button 
          onClick={() => setActiveReportTab('udhar')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeReportTab === 'udhar' ? '600' : '500',
            backgroundColor: activeReportTab === 'udhar' ? '#dc2626' : '#f1f5f9',
            color: activeReportTab === 'udhar' ? '#ffffff' : '#475569'
          }}>
          ખેડૂત બાકી ઉધાર યાદી ({farmersWithDue.length})
        </button>
      </div>

      {/* Tab 1: Sales Invoices Report */}
      {activeReportTab === 'sales' && (
        <div>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
              <div className="stat-info">
                <div className="stat-value">₹{totalFilteredSalesAmt.toLocaleString('en-IN')}</div>
                <div className="stat-label">કુલ વેચાણ રકમ ({filteredSales.length} બિલો)</div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
              <div className="stat-info">
                <div className="stat-value">₹{totalFilteredPaidAmt.toLocaleString('en-IN')}</div>
                <div className="stat-label">કુલ જમા થયેલ રોકડ / UPI</div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="stat-info">
                <div className="stat-value">₹{totalFilteredDueAmt.toLocaleString('en-IN')}</div>
                <div className="stat-label">આ સમયગાળામાં ઊભી થયેલ બાકી ઉધાર</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>બિલ નં</th>
                    <th>તારીખ</th>
                    <th>ખેડૂતનું નામ</th>
                    <th>મોબાઇલ / ગામ</th>
                    <th>કુલ રકમ</th>
                    <th>જમા રકમ</th>
                    <th>બાકી રકમ</th>
                    <th className="no-print">એક્શન</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '600' }}>{s.billNo}</td>
                      <td>{s.billDate}</td>
                      <td style={{ fontWeight: '600' }}>{s.farmerName}</td>
                      <td>{s.farmerVillage} ({s.farmerMobile || '—'})</td>
                      <td style={{ fontWeight: '600' }}>₹{s.netAmount?.toLocaleString('en-IN')}</td>
                      <td style={{ color: '#16a34a' }}>₹{s.paidAmount?.toLocaleString('en-IN')}</td>
                      <td style={{ color: s.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                        ₹{s.dueAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="no-print">
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => onOpenBill(s)}>
                          બિલ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Variety-wise Report */}
      {activeReportTab === 'variety' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">બિયારણ જાત વાઇઝ કુલ વેચાણ આંકડા</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>બિયારણ જાતનું નામ</th>
                  <th>વેચાયેલ કુલ બોરી</th>
                  <th>વેચાયેલ છૂટક KG</th>
                  <th>કુલ નેટ વજન (KG)</th>
                  <th>કુલ વેચાણ આવક (₹)</th>
                </tr>
              </thead>
              <tbody>
                {varietyReports.map((vr, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', color: '#064e3b' }}>{vr.name}</td>
                    <td style={{ fontWeight: '700' }}>{vr.bags} બોરી</td>
                    <td>{vr.looseKg} kg</td>
                    <td style={{ fontWeight: '700', color: '#059669' }}>{vr.totalKg} kg</td>
                    <td style={{ fontWeight: '700' }}>₹{vr.totalAmount?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Udhar (Pending Due) Report */}
      {activeReportTab === 'udhar' && (
        <div>
          <div className="card" style={{ marginBottom: '1.25rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#991b1b', fontSize: '1.2rem', fontWeight: '700' }}>
                  કુલ બાકી ઉઘરાણી: ₹{totalOutstanding.toLocaleString('en-IN')}
                </h3>
                <p style={{ color: '#b91c1c', fontSize: '0.88rem' }}>
                  કુલ {farmersWithDue.length} ખેડૂતો/વેપારીઓ પાસેથી ઉધાર વસૂલાત બાકી છે.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>કોડ</th>
                    <th>ખેડૂતનું નામ</th>
                    <th>ગામ / તાલુકો</th>
                    <th>મોબાઇલ</th>
                    <th>બાકી ઉધાર રકમ (₹)</th>
                    <th>ઉધાર મર્યાદા (₹)</th>
                    <th className="no-print">WhatsApp ઉઘરાણી</th>
                  </tr>
                </thead>
                <tbody>
                  {farmersWithDue.map(f => (
                    <tr key={f.id}>
                      <td><span className="badge badge-primary">{f.code}</span></td>
                      <td style={{ fontWeight: '600' }}>{f.name}</td>
                      <td>{f.village} ({f.taluka || ''})</td>
                      <td>{f.mobile}</td>
                      <td style={{ fontWeight: '700', color: '#dc2626', fontSize: '1.05rem' }}>
                        ₹{f.currentBalance?.toLocaleString('en-IN')}
                      </td>
                      <td>₹{f.creditLimit?.toLocaleString('en-IN')}</td>
                      <td className="no-print">
                        <button 
                          className="btn"
                          style={{ backgroundColor: '#25D366', color: 'white', padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleWhatsAppAlert(f)}>
                          <MessageCircle size={15} />
                          યાદી મોકલો
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
