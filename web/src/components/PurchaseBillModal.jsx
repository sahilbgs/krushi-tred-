import React from 'react';
import { Printer, X, CheckCircle2, Phone, MapPin, Truck } from 'lucide-react';

export const PurchaseBillModal = ({ purchase, onClose }) => {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFarmer = purchase.purchaseType === 'farmer';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Action Bar (Hidden in Print) */}
        <div className="no-print" style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${isFarmer ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}>
              {isFarmer ? 'ખેડૂત ખરીદી પાવતી' : 'માર્કેટ પેઢી ખરીદી પાવતી'}
            </span>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>
              બિલ નં: {purchase.billNo}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}>
              <Printer size={17} />
              પ્રિન્ટ / PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '0.35rem',
                borderRadius: '6px'
              }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Printable Bill Paper */}
        <div id="printable-purchase-bill" style={{ padding: '2rem', color: '#1e293b', fontFamily: 'inherit' }}>
          
          {/* Company Banner */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #064e3b', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#064e3b', letterSpacing: '0.04em' }}>
              SHREE NANDINI SEEDS
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#059669', marginTop: '0.15rem' }}>
              શ્રી નંદિની સીડ્સ • બિયારણ ખરીદ-વેચાણ કેન્દ્ર
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
              મુખ્ય યાર્ડ રોડ, જૂનાગઢ - રાજકોટ હાઈવે, ગુજરાત • મો. +91 98250 12345
            </div>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#ecfdf5',
              color: '#064e3b',
              padding: '0.2rem 1rem',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: '700',
              marginTop: '0.5rem',
              border: '1px solid #a7f3d0'
            }}>
              {isFarmer ? 'ખરીદી વાઉચર (ખેડૂત સીધી ખરીદી)' : 'ખરીદી વાઉચર (માર્કેટિંગ યાર્ડ પેઢી/વેપારી)'}
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                {isFarmer ? 'ખેડૂતનું નામ:' : 'પેઢી / વેપારીનું નામ:'}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                {purchase.partyName}
              </div>
              {purchase.firmName && purchase.traderName && (
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.15rem' }}>
                  પેઢી: <b>{purchase.firmName}</b> | વેપારી: <b>{purchase.traderName}</b>
                </div>
              )}
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} /> {purchase.village || '—'}
                {purchase.mobile && (
                  <span style={{ marginLeft: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={13} /> {purchase.mobile}
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>વાઉચર નં: </span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#064e3b' }}>{purchase.billNo}</span>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>તારીખ: </span>
                <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{purchase.purchaseDate}</span>
              </div>
              {purchase.truckNo && (
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                  <Truck size={14} /> ટ્રક નં: <b>{purchase.truckNo}</b> {purchase.truckOwner ? `(${purchase.truckOwner})` : ''}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                યુનિટ: ૧ બોરી = ૩૫ KG | ૧ મણ = ૨૦ KG
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.82rem', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem', border: '1px solid #064e3b' }}>ક્રમ</th>
                <th style={{ padding: '0.65rem', border: '1px solid #064e3b' }}>બિયારણ જાત (Variety)</th>
                <th style={{ padding: '0.65rem', textAlign: 'center', border: '1px solid #064e3b' }}>કુલ બેગ</th>
                <th style={{ padding: '0.65rem', textAlign: 'center', border: '1px solid #064e3b' }}>છેલ્લી બેગ (KG)</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #064e3b' }}>કુલ વજન (KG)</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #064e3b' }}>કુલ મણ</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #064e3b' }}>ભાવ (₹/મણ)</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #064e3b' }}>માલની રકમ (₹)</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items?.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <td style={{ padding: '0.65rem', border: '1px solid #e2e8f0' }}>{idx + 1}</td>
                  <td style={{ padding: '0.65rem', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>
                    {it.varietyName}
                  </td>
                  <td style={{ padding: '0.65rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <b>{it.bags}</b> બોરી
                  </td>
                  <td style={{ padding: '0.65rem', textAlign: 'center', border: '1px solid #e2e8f0', color: '#475569' }}>
                    {it.lastBagKg} KG
                  </td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #e2e8f0' }}>
                    <b>{it.netWeightKg}</b> kg
                  </td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #e2e8f0', color: '#064e3b', fontWeight: '700' }}>
                    {Number(it.totalMan).toFixed(2)} મણ
                  </td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #e2e8f0' }}>
                    ₹{Number(it.ratePerMan).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '700' }}>
                    ₹{Math.round(it.itemTotal).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '700', fontSize: '0.88rem' }}>
                <td colSpan={2} style={{ padding: '0.65rem', border: '1px solid #cbd5e1' }}>કુલ સરવાળો</td>
                <td style={{ padding: '0.65rem', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                  {purchase.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0)} બેગ
                </td>
                <td style={{ padding: '0.65rem', textAlign: 'center', border: '1px solid #cbd5e1' }}>—</td>
                <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                  {purchase.items?.reduce((s, it) => s + parseFloat(it.netWeightKg || 0), 0)} KG
                </td>
                <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #cbd5e1', color: '#064e3b' }}>
                  {purchase.items?.reduce((s, it) => s + parseFloat(it.totalMan || 0), 0).toFixed(2)} મણ
                </td>
                <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #cbd5e1' }}>—</td>
                <td style={{ padding: '0.65rem', textAlign: 'right', border: '1px solid #cbd5e1', color: '#064e3b' }}>
                  ₹{Math.round(purchase.itemsSubTotal || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Expenses & Grand Net Total Calculation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left: Notes & Signatures */}
            <div>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>ખાસ નોંધ:</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {purchase.remarks || 'કોઈ નોંધ નથી.'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  બિલ સેવ કરનાર: <b>{purchase.createdBy || 'Main Admin'}</b>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '130px', margin: '0 auto 0.25rem' }}></div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ખાતેદારની સહી</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px dashed #94a3b8', width: '150px', margin: '0 auto 0.25rem' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#064e3b' }}>શ્રી નંદિની સીડ્સ વતી</span>
                </div>
              </div>
            </div>

            {/* Right: Detailed Expenses Breakdown */}
            <div style={{ backgroundColor: '#fdfbf7', border: '1px solid #fed7aa', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748b' }}>માલની મૂળ રકમ:</span>
                <span style={{ fontWeight: '600' }}>₹{Math.round(purchase.itemsSubTotal || 0).toLocaleString('en-IN')}</span>
              </div>

              {isFarmer ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.88rem', color: '#b45309' }}>
                  <span>મજૂરી ખર્ચ ({purchase.majuriRatePerBag || 0} ₹/બેગ):</span>
                  <span>+ ₹{(purchase.majuriAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  {purchase.marketCommission > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>માર્કેટ કમિશન:</span>
                      <span>+ ₹{Number(purchase.marketCommission).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {purchase.firmCommission > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>પેઢીનું કમિશન:</span>
                      <span>+ ₹{Number(purchase.firmCommission).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {purchase.bardanExpense > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>બારદાન ખર્ચ:</span>
                      <span>+ ₹{Number(purchase.bardanExpense).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {purchase.majuriAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>મજૂરી:</span>
                      <span>+ ₹{Number(purchase.majuriAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </>
              )}

              <div style={{
                borderTop: '2px solid #064e3b',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: '800',
                color: '#064e3b'
              }}>
                <span>Net Total (ચોખ્ખી રકમ):</span>
                <span>₹{Math.round(purchase.netTotal || 0).toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0 0.2rem', fontSize: '0.88rem', color: '#166534' }}>
                <span>ચૂકવેલ રકમ ({purchase.paymentMode === 'cash' ? 'રોકડ' : purchase.paymentMode === 'bank' ? 'બેંક/NEFT' : purchase.paymentMode === 'credit' ? 'ઉધાર' : 'આંશિક'}):</span>
                <span style={{ fontWeight: '700' }}>₹{Math.round(purchase.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>

              <div style={{
                borderTop: '1px dashed #ea580c',
                marginTop: '0.35rem',
                paddingTop: '0.35rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: purchase.dueAmount > 0 ? '#c2410c' : '#16a34a'
              }}>
                <span>બાકી રકમ (Balance):</span>
                <span>₹{Math.round(purchase.dueAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
            આ કોમ્પ્યુટર જનરેટેડ વાઉચર છે • SHREE NANDINI SEEDS PURCHASE MODULE
          </div>

        </div>

      </div>
    </div>
  );
};
