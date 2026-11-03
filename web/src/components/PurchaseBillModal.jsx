import React from 'react';
import { Printer, MessageCircle, X, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { numberToGujaratiWords } from './SimpleBillModal';

/**
 * Formats a date into DD.MM.YYYY
 */
function formatBillDate(d) {
  if (!d) return '—';
  if (d.includes('.')) return d;
  const parts = d.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  }
  return d;
}

export const PurchaseBillModal = ({ purchase, onClose }) => {
  const { parties } = useData();

  if (!purchase) return null;

  const isFarmer = purchase.purchaseType === 'farmer';

  // Resolve Party Details
  const partyName = purchase.partyName || '—';
  const partyMobile = purchase.mobile || '';
  const partyVillage = purchase.village || '—';

  // Lookup in parties master if taluka/district needed
  const matchedParty = parties?.find(p =>
    p.id === purchase.partyId ||
    (partyName && p.name && p.name.trim().toLowerCase() === partyName.trim().toLowerCase())
  );

  const taluka = purchase.taluka || matchedParty?.taluka || 'દિયોદર';
  const district = purchase.district || matchedParty?.district || (partyMobile ? 'મો. ' + partyMobile : 'વાવ - થરાદ');

  // Bill Number & Date
  const billNoDisplay = (purchase.billNo || '—').replace(/^SN-PUR-\d{4}-/, '');
  const billDateDisplay = formatBillDate(purchase.purchaseDate);

  // Items & Calculations
  const itemsList = purchase.items || [];
  const netAmount = Math.round(Number(purchase.netTotal || purchase.itemsSubTotal || 0));
  const majuriAmount = Math.round(Number(purchase.majuriAmount || 0));
  const marketCommission = Math.round(Number(purchase.marketCommission || 0));
  const firmCommission = Math.round(Number(purchase.firmCommission || 0));
  const bardanExpense = Math.round(Number(purchase.bardanExpense || 0));

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!partyMobile) {
      alert("પાર્ટીનો મોબાઇલ નંબર નથી મળ્યો.");
      return;
    }

    const itemsText = itemsList.map((it, idx) => {
      const kg = it.netWeightKg || it.qtyKg || (it.bags * 35);
      const crop = it.cropType || 'મગફળી';
      const rate = it.ratePerMan || it.rate || 0;
      const amount = Math.round(it.itemTotal || it.amount || 0);
      return `${idx + 1}. *${crop} - ${it.varietyName || it.productName}*: ${it.bags} બેગ (${kg} kg) @ ₹${rate}/મણ = ₹${amount.toLocaleString('en-IN')}`;
    }).join('%0A');

    let chargesText = '';
    if (majuriAmount > 0) {
      if (isFarmer) {
        chargesText += `%0A- બાદ મજૂરી: ₹${majuriAmount.toLocaleString('en-IN')}`;
      } else {
        chargesText += `%0A+ મજૂરી ખર્ચ: ₹${majuriAmount.toLocaleString('en-IN')}`;
      }
    }
    if (marketCommission > 0) chargesText += `%0A+ માર્કેટ કમિશન: ₹${marketCommission.toLocaleString('en-IN')}`;
    if (firmCommission > 0) chargesText += `%0A+ પેઢી કમિશન: ₹${firmCommission.toLocaleString('en-IN')}`;
    if (bardanExpense > 0) chargesText += `%0A+ બારદાન ખર્ચ: ₹${bardanExpense.toLocaleString('en-IN')}`;

    const wordsText = numberToGujaratiWords(netAmount);

    const msg = `*શ્રી નંદિની સીડ્સ (SHREE NANDINI SEEDS)*%0A` +
      `*ખરીદી વાઉચર (PURCHASE BILL)*%0A` +
      `--------------------------------%0A` +
      `*વાઉચર નં:* ${billNoDisplay}%0A` +
      `*તારીખ:* ${billDateDisplay}%0A` +
      `*નામ:* ${partyName}%0A` +
      `*ગામ:* ${partyVillage}%0A` +
      `*તાલુકો:* ${taluka} | *જિલ્લો:* ${district}%0A` +
      (purchase.truckNo ? `*ગાડી નં:* ${purchase.truckNo}%0A` : '') +
      `--------------------------------%0A` +
      itemsText + `%0A` +
      chargesText + `%0A` +
      `--------------------------------%0A` +
      `*કુલ ચોખ્ખી રકમ: ₹${netAmount.toLocaleString('en-IN')}*` + `%0A` +
      `*રકમ અક્ષરે:* ${wordsText}%0A%0A` +
      `શ્રી નંદિની સીડ્સ 🙏`;

    const cleanMobile = partyMobile.replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    window.open(`https://wa.me/${mobileWithCountry}?text=${msg}`, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', padding: '1.25rem', backgroundColor: '#f8fafc' }}>
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="modal-header no-print" style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={22} color="#0d5c2c" />
            <h3 style={{ fontSize: '1.15rem', color: '#0d5c2c', fontWeight: '800', margin: 0 }}>
              શ્રી નંદિની સીડ્સ - ખરીદી વાઉચર
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={22} />
          </button>
        </div>

        {/* Printable Bill Area - EXACT FORMAT MATCHING USER SAMPLE */}
        <div 
          className="printable-bill" 
          id="printable-purchase-bill"
          style={{ 
            padding: '24px 22px 28px 22px', 
            backgroundColor: '#ffffff', 
            color: '#000000',
            border: '1.5px solid #000000',
            width: '100%',
            maxWidth: '680px',
            margin: '0 auto',
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", "Shruti", sans-serif'
          }}
        >
          
          {/* Header Section */}
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '8px' }}>
            
            {/* Left Brand Logo (Leaves + English Text) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
              <svg width="68" height="38" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 48 Q 50 40 88 48 Q 50 36 12 48 Z" fill="#8c6239" />
                <path d="M48 42 C 40 28, 18 20, 16 12 C 32 10, 44 24, 48 42 Z" fill="#78a834" />
                <path d="M48 42 C 54 24, 76 14, 88 10 C 84 26, 68 36, 48 42 Z" fill="#358b2e" />
                <path d="M47 42 C 46 36, 48 30, 52 26" stroke="#256c20" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div style={{ color: '#0d5c2c', fontWeight: '800', fontSize: '14px', lineHeight: '1.15', textAlign: 'center', marginTop: '3px' }}>
                Shree Nandini
              </div>
              <div style={{ color: '#0d5c2c', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                Seeds <span style={{ fontSize: '12px' }}>🌱</span>
              </div>
            </div>

            {/* Vertical Green Divider Line */}
            <div style={{ width: '1.5px', height: '60px', backgroundColor: '#0d5c2c', margin: '0 24px' }} />

            {/* Right Gujarati Title with Flourish */}
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0d5c2c', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>શ્રી નંદિની સીડ્સ</span>
              <svg width="34" height="26" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 24 Q 18 24 26 14 C 30 8, 36 6, 38 4 C 36 14, 28 22, 14 26 Z" fill="#78a834" />
                <path d="M22 16 C 26 12, 32 10, 36 10 C 32 16, 26 20, 20 22 Z" fill="#358b2e" />
              </svg>
            </div>
          </div>

          {/* Full-width Horizontal Green Line */}
          <div style={{ height: '2.5px', backgroundColor: '#0d5c2c', width: '100%', marginTop: '8px', marginBottom: '16px' }} />

          {/* Bill No & Date Box (Top Left) */}
          <div style={{ width: '220px', border: '1.5px solid #000000', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ padding: '6px 12px', borderBottom: '1.5px solid #000000' }}>
              ખરીદી નં. : <span>{billNoDisplay}</span>
            </div>
            <div style={{ padding: '6px 12px' }}>
              તારીખ : <span>{billDateDisplay}</span>
            </div>
          </div>

          {/* Customer / Party Details Box */}
          <div style={{ border: '1.5px solid #000000', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ padding: '7px 12px', borderBottom: '1.5px solid #000000' }}>
              નામ : <span>{partyName}</span> {purchase.firmName ? `(${purchase.firmName})` : ''}
            </div>
            <div style={{ padding: '7px 12px', borderBottom: '1.5px solid #000000' }}>
              ગામ : <span>{partyVillage}</span>
            </div>
            <div style={{ display: 'flex', borderBottom: purchase.truckNo ? '1.5px solid #000000' : 'none' }}>
              <div style={{ flex: 1, padding: '7px 12px', borderRight: '1.5px solid #000000' }}>
                તાલુકો : <span>{taluka}</span>
              </div>
              <div style={{ flex: 1, padding: '7px 12px' }}>
                જિલ્લો : <span>{district}</span>
              </div>
            </div>
            {purchase.truckNo && (
              <div style={{ padding: '7px 12px' }}>
                ગાડી નં. : <span>{purchase.truckNo}</span> {purchase.truckOwner ? `(${purchase.truckOwner})` : ''}
              </div>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', fontSize: '14px', marginBottom: '16px', backgroundColor: '#ffffff' }}>
            <thead>
              <tr>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '17%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center' }}>
                  પાક
                </th>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '20%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center' }}>
                  જાત
                </th>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '12%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
                  બેગ<br/>(નંગ)
                </th>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '16%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
                  જથ્થો<br/>(કિ.ગ્રા.)
                </th>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '17%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
                  દર<br/>(રૂ./મણ)
                </th>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '18%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
                  રકમ<br/>(રૂ.)
                </th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((it, idx) => {
                const kg = it.netWeightKg || it.qtyKg || (it.bags * 35);
                const crop = it.cropType || 'મગફળી';
                const rate = it.ratePerMan || it.rate || 0;
                const itemAmount = Math.round(it.itemTotal || it.amount || 0);

                return (
                  <tr key={idx}>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {crop}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {it.varietyName || it.productName}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {it.bags}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {kg}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {Number(rate).toLocaleString('en-IN')}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                      {itemAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}

              {/* મજૂરી Row */}
              {majuriAmount > 0 && (
                <tr>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    {isFarmer ? 'બાદ: મજૂરી' : 'મજૂરી'}
                  </td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    {isFarmer ? `- ${majuriAmount.toLocaleString('en-IN')}` : majuriAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {/* કમિશન / અન્ય ખર્ચ (જો હોય તો) */}
              {marketCommission > 0 && (
                <tr>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    માર્કેટ કમિશન
                  </td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    {marketCommission.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {firmCommission > 0 && (
                <tr>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    પેઢી કમિશન
                  </td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    {firmCommission.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {bardanExpense > 0 && (
                <tr>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    બારદાન ખર્ચ
                  </td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                    {bardanExpense.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {/* કુલ રકમ Row */}
              <tr>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800', backgroundColor: '#dcf2d9' }}>
                  કુલ રકમ
                </td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800', backgroundColor: '#dcf2d9' }}>
                  {netAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount In Words Box */}
          <div style={{ border: '1.5px solid #000000', fontSize: '14px', marginBottom: '22px', backgroundColor: '#ffffff' }}>
            <div style={{ backgroundColor: '#dcf2d9', padding: '6px 12px', fontWeight: '800', borderBottom: '1.5px solid #000000' }}>
              રકમ અક્ષરે (રૂપિયામાં) :
            </div>
            <div style={{ padding: '8px 12px', fontWeight: '800', fontSize: '14.5px' }}>
              {numberToGujaratiWords(netAmount)}
            </div>
          </div>

          {/* Signatory Box (Bottom Right) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <div style={{ width: '230px', border: '1.5px solid #000000', padding: '14px 10px', textAlign: 'center', backgroundColor: '#ffffff' }}>
              <div style={{ color: '#0d5c2c', fontWeight: '800', fontSize: '15px', marginBottom: '38px' }}>
                શ્રી નંદિની સીડ્સ તરફથી,
              </div>
              <div style={{ borderTop: '1px solid #000000', width: '130px', margin: '0 auto 6px auto' }} />
              <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#000000' }}>
                અધિકૃત સહીકર્તા
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons (Hidden in Print) */}
        <div className="modal-footer no-print" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}>
            બંધ કરો
          </button>
          
          <button 
            type="button" 
            className="btn" 
            style={{ backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleWhatsAppShare}>
            <MessageCircle size={18} />
            વોટ્સએપ પર મોકલો
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ backgroundColor: '#0d5c2c', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handlePrint}>
            <Printer size={18} />
            બિલ પ્રિન્ટ કરો (A4)
          </button>
        </div>

      </div>
    </div>
  );
};
