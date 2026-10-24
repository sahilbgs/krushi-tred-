import React from 'react';
import { Printer, MessageCircle, X, CheckCircle } from 'lucide-react';

export const SimpleBillModal = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!sale.farmerMobile) {
      alert("ખેડૂતનો મોબાઇલ નંબર નથી મળ્યો.");
      return;
    }

    let itemsText = sale.items.map((it, idx) => 
      `${idx + 1}. ${it.varietyName} - ${it.bags} બોરી ${it.looseKg > 0 ? `+ ${it.looseKg} kg` : ''} (કુલ ${it.totalWeightKg} kg) @ ₹${it.rate} = ₹${it.itemTotal}`
    ).join('%0A');

    const msg = `*કૃષિ ટ્રેડ - બિયારણ સાદું બિલ*%0A` +
      `બિલ નં: ${sale.billNo}%0A` +
      `તારીખ: ${sale.billDate}%0A` +
      `ખેડૂત: ${sale.farmerName} (${sale.farmerVillage || ''})%0A` +
      `--------------------------------%0A` +
      itemsText + `%0A` +
      `--------------------------------%0A` +
      `કુલ રકમ: ₹${sale.subTotal}%0A` +
      `ડિસ્કાઉન્ટ: ₹${sale.discount || 0}%0A` +
      `ચૂકવવાપાત્ર: ₹${sale.netAmount}%0A` +
      `જમા રોકડ: ₹${sale.paidAmount}%0A` +
      `*બાકી રકમ (ઉધાર): ₹${sale.dueAmount}*%0A%0A` +
      `કૃષિ ટ્રેડ માંથી ખરીદી કરવા બદલ આભાર! 🙏`;

    const cleanMobile = sale.farmerMobile.replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    window.open(`https://wa.me/${mobileWithCountry}?text=${msg}`, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={22} color="#059669" />
            <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>સાદું બિલ તૈયાર છે</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={22} />
          </button>
        </div>

        {/* Printable Bill Area */}
        <div className="printable-bill" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#0f172a' }}>
          
          {/* Shop Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#064e3b', letterSpacing: '0.02em' }}>
              🌱 કૃષિ ટ્રેડ (KRUSHI TRADE)
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginTop: '0.2rem' }}>
              ઉત્તમ ગુણવત્તાવાળા બિયારણના વિક્રેતા • હોલસેલ & રીટેઈલ
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              સ્ટેશન રોડ, માર્કેટ યાર્ડ પાસે, જૂનાગઢ (ગુજરાત) | મો. ૯૮૨૫૦ ૦૦૦૦૦
            </div>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: '700',
              padding: '0.2rem 0.8rem',
              borderRadius: '9999px',
              border: '1px solid #a7f3d0',
              marginTop: '0.4rem'
            }}>
              સાદું વેચાણ બિલ (SIMPLE CASH / CREDIT MEMO)
            </div>
          </div>

          {/* Bill & Customer Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <div><strong>બિલ નં:</strong> {sale.billNo}</div>
              <div><strong>તારીખ:</strong> {sale.billDate}</div>
              <div><strong>કાઉન્ટર સ્ટાફ:</strong> {sale.createdBy || 'કૃષિ ટ્રેડ'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>ખેડૂત / ગ્રાહક:</strong> {sale.farmerName}</div>
              <div><strong>ગામ:</strong> {sale.farmerVillage || '—'}</div>
              <div><strong>મોબાઇલ:</strong> {sale.farmerMobile || '—'}</div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>ક્રમ</th>
                <th style={{ padding: '0.5rem' }}>બિયારણ વિગત</th>
                <th style={{ padding: '0.5rem' }}>બેચ નં</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>બોરી</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>કુલ KG</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>ભાવ</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>રકમ (₹)</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{idx + 1}</td>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600' }}>
                    {it.varietyName}
                    {it.looseKg > 0 && <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>(+ {it.looseKg} kg છૂટક)</span>}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#475569' }}>{it.batchNo || '—'}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{it.bags}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{it.totalWeightKg} kg</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>₹{it.rate}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>₹{it.itemTotal?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculation Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '280px', fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span>કુલ રકમ (Sub Total):</span>
                <span>₹{sale.subTotal?.toLocaleString('en-IN')}</span>
              </div>
              {sale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#dc2626' }}>
                  <span>ડિસ્કાઉન્ટ:</span>
                  <span>- ₹{sale.discount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0', fontWeight: '700', fontSize: '1.05rem', color: '#064e3b' }}>
                <span>ચૂકવવાપાત્ર રકમ:</span>
                <span>₹{sale.netAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#16a34a' }}>
                <span>જમા રોકડ / UPI:</span>
                <span>₹{sale.paidAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.4rem 0.5rem', 
                backgroundColor: sale.dueAmount > 0 ? '#fee2e2' : '#f0fdf4',
                color: sale.dueAmount > 0 ? '#991b1b' : '#166534',
                borderRadius: '6px',
                fontWeight: '700',
                marginTop: '0.4rem'
              }}>
                <span>{sale.dueAmount > 0 ? 'બાકી રકમ (ઉધાર):' : 'હિસાબ પૂરો (Paid)'}</span>
                <span>₹{sale.dueAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatures */}
          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem', color: '#64748b' }}>
            <div>
              <p>• વેચેલો માલ પરત લેવામાં આવશે નહીં.</p>
              <p>• ઉગાવાની સંપૂર્ણ ખાતરી કંપનીની ગેરંટી મુજબ રહેશે.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ minHeight: '35px' }}></div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.25rem', width: '130px', fontWeight: '600', color: '#334155' }}>
                કૃષિ ટ્રેડ સહી/સિક્કો
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons (Hidden in Print) */}
        <div className="modal-footer no-print">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}>
            બંધ કરો
          </button>
          
          <button 
            type="button" 
            className="btn" 
            style={{ backgroundColor: '#25D366', color: 'white' }}
            onClick={handleWhatsAppShare}>
            <MessageCircle size={18} />
            વોટ્સએપ પર મોકલો
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handlePrint}>
            <Printer size={18} />
            બિલ પ્રિન્ટ કરો (A4 / Thermal)
          </button>
        </div>

      </div>
    </div>
  );
};
