import React from 'react';
import { Printer, MessageCircle, X, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';

/**
 * Converts a number into Gujarati words.
 * Example: 14380 -> "ચૌદ હજાર ત્રણસો એસી રૂપિયા પુરાં માત્ર."
 */
export function numberToGujaratiWords(n) {
  n = Math.round(Number(n || 0));
  if (n === 0) return 'શૂન્ય રૂપિયા પુરાં માત્ર.';

  const ones = [
    '', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ',
    'દસ', 'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણીસ',
    'વીસ', 'એકવીસ', 'બાવીસ', 'ત્રેવીસ', 'ચોવીસ', 'પચ્ચીસ', 'છવ્વીસ', 'सत्ताવીસ', 'અઠ્ઠાવીસ', 'ઓગણત્રીસ',
    'ત્રીસ', 'એકત્રીસ', 'બત્રીસ', 'તેત્રીસ', 'ચોત્રીસ', 'પાંત્રીસ', 'છત્રીસ', 'સાડત્રીસ', 'આડત્રીસ', 'ઓગણચાલીસ',
    'ચાલીસ', 'એકતાલીસ', 'બેતાલીસ', 'તેતાલીસ', 'ચુંમાલીસ', 'પિસ્તાલીસ', 'છેતાલીસ', 'સુડતાલીસ', 'અડતાલીસ', 'ઓગણપચાસ',
    'પચાસ', 'એકાવન', 'બાવન', 'ત્રેપન', 'ચોપન', 'પંચાવન', 'છપ્પન', 'સત્તાવન', 'અઠ્ઠાવન', 'ઓગણસાઠ',
    'સાઠ', 'એકસઠ', 'બાસઠ', 'ત્રેસઠ', 'ચોસઠ', 'પાંસઠ', 'છાસઠ', 'સડસઠ', 'અડસઠ', 'ઓગણોસિત્તેર',
    'સિત્તેર', 'એકોતેર', 'બોતેર', 'તેંતેર', 'ચુમોતેર', 'પંચોતેર', 'છોતેર', 'સંતોતેર', 'ઇઠોતેર', 'ઓગણાએંસી',
    'એસી', 'એક્યાસી', 'બ્યાસી', 'ત્યાંસી', 'ચોર્યાસી', 'પંચાસી', 'છ્યાસી', 'સત્યાસી', 'અઠ્યાસી', 'નેવ્યાસી',
    'નેવું', 'એકાણું', 'બાણું', 'ત્રાણું', 'ચોરાણું', 'પંચાણું', 'છન્નું', 'સત્તાણું', 'અઠ્ઠાણું', 'નવ્વાણું'
  ];

  function convertTwoDigits(num) {
    return ones[num] || '';
  }

  let words = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  if (crore > 0) words += convertTwoDigits(crore) + ' કરોડ ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' લાખ ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' હજાર ';
  if (hundred > 0) {
    if (hundred === 1) words += 'એકસો ';
    else if (hundred === 2) words += 'બસો ';
    else if (hundred === 3) words += 'ત્રણસો ';
    else words += convertTwoDigits(hundred) + 'સો ';
  }
  if (remainder > 0) {
    words += convertTwoDigits(remainder) + ' ';
  }

  return words.trim() + ' રૂપિયા પુરાં માત્ર.';
}

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

export const SimpleBillModal = ({ sale, onClose }) => {
  const { parties } = useData();

  if (!sale) return null;

  // Resolve Farmer / Customer details
  const farmerName = sale.farmerName || sale.partyName || '—';
  const farmerMobile = sale.farmerMobile || sale.partyMobile || '';
  const farmerVillage = sale.farmerVillage || sale.village || '—';

  // Look up Party for taluka / district if available
  const matchedParty = parties?.find(p => 
    p.id === sale.farmerId || 
    p.id === sale.partyId || 
    (farmerName && p.name && p.name.trim().toLowerCase() === farmerName.trim().toLowerCase())
  );

  const farmerTaluka = sale.farmerTaluka || matchedParty?.taluka || 'દિયોદર';
  const farmerDistrict = sale.farmerDistrict || matchedParty?.district || 'વાવ - થરાદ';

  // Resolve Bill Number
  const billNoDisplay = (sale.billNo || sale.invoiceNo || '—').replace(/^KT-S-\d{4}-/, '');
  const billDateDisplay = formatBillDate(sale.billDate || sale.date);

  // Items
  const itemsList = sale.items || [];
  const netAmount = Number(sale.netAmount || sale.netTotal || sale.totalAmount || 0);
  const majuriAmount = Number(sale.majuriAmount || sale.chargesTotal || 0);
  const discount = Number(sale.discount || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!farmerMobile) {
      alert("ખેડૂતનો મોબાઇલ નંબર નથી મળ્યો.");
      return;
    }

    const itemsText = itemsList.map((it, idx) => {
      const kg = it.totalWeightKg || (it.bags * 35);
      const crop = it.cropType || 'મગફળી';
      return `${idx + 1}. *${crop} - ${it.varietyName}*: ${it.bags} બેગ (${kg} kg) @ ₹${it.rate} = ₹${(it.itemTotal || it.amount)?.toLocaleString('en-IN')}`;
    }).join('%0A');

    let chargesText = '';
    if (majuriAmount > 0) chargesText += `%0A+ મજૂરી ખર્ચ: ₹${majuriAmount.toLocaleString('en-IN')}`;
    if (discount > 0) chargesText += `%0A- ડિસ્કાઉન્ટ: ₹${discount.toLocaleString('en-IN')}`;

    const wordsText = numberToGujaratiWords(netAmount);

    const msg = `*શ્રી નંદિની સીડ્સ (SHREE NANDINI SEEDS)*%0A` +
      `--------------------------------%0A` +
      `*બીલ નં:* ${billNoDisplay}%0A` +
      `*તારીખ:* ${billDateDisplay}%0A` +
      `*નામ:* ${farmerName}%0A` +
      `*ગામ:* ${farmerVillage}%0A` +
      `*તાલુકો:* ${farmerTaluka} | *જિલ્લો:* ${farmerDistrict}%0A` +
      `--------------------------------%0A` +
      itemsText + `%0A` +
      chargesText + `%0A` +
      `--------------------------------%0A` +
      `*કુલ રકમ: ₹${netAmount.toLocaleString('en-IN')}*` + `%0A` +
      `*રકમ અક્ષરે:* ${wordsText}%0A%0A` +
      `ખરીદી કરવા બદલ આપનો ખૂબ ખૂબ આભાર! 🙏%0A` +
      `*શ્રી નંદિની સીડ્સ*`;

    const cleanMobile = farmerMobile.replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    window.open(`https://wa.me/${mobileWithCountry}?text=${msg}`, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', padding: '1.25rem', backgroundColor: '#f8fafc' }}>
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="modal-header no-print" style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={22} color="#0d5c2c" />
            <h3 style={{ fontSize: '1.15rem', color: '#0d5c2c', fontWeight: '800' }}>
              શ્રી નંદિની સીડ્સ - બિલ તૈયાર છે
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
          <div style={{ width: '210px', border: '1.5px solid #000000', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ padding: '6px 12px', borderBottom: '1.5px solid #000000' }}>
              બીલ નં. : <span>{billNoDisplay}</span>
            </div>
            <div style={{ padding: '6px 12px' }}>
              તારીખ : <span>{billDateDisplay}</span>
            </div>
          </div>

          {/* Customer Details Box */}
          <div style={{ border: '1.5px solid #000000', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ padding: '7px 12px', borderBottom: '1.5px solid #000000' }}>
              નામ : <span>{farmerName}</span>
            </div>
            <div style={{ padding: '7px 12px', borderBottom: '1.5px solid #000000' }}>
              ગામ : <span>{farmerVillage}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1, padding: '7px 12px', borderRight: '1.5px solid #000000' }}>
                તાલુકો : <span>{farmerTaluka}</span>
              </div>
              <div style={{ flex: 1, padding: '7px 12px' }}>
                જિલ્લો : <span>{farmerDistrict}</span>
              </div>
            </div>
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
                  દર<br/>(રૂ./કિ.ગ્રા.)
                </th>
                <th style={{ border: '1.5px solid #000000', padding: '7px 5px', width: '18%', backgroundColor: '#dcf2d9', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
                  રકમ<br/>(રૂ.)
                </th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((it, idx) => {
                const kg = it.totalWeightKg || (it.bags * 35);
                const crop = it.cropType || 'મગફળી';
                const itemAmount = Number(it.itemTotal || it.amount || 0);

                return (
                  <tr key={idx}>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {crop}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {it.varietyName}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {it.bags}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {kg}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '700' }}>
                      {Number(it.rate || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                      {itemAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}

              {/* મજૂરી Row */}
              <tr>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                  મજૂરી
                </td>
                <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800' }}>
                  {majuriAmount.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* ડિસ્કાઉન્ટ (જો હોય તો) */}
              {discount > 0 && (
                <tr>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px' }}>&nbsp;</td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800', color: '#b91c1c' }}>
                    ડિસ્કાઉન્ટ (-)
                  </td>
                  <td style={{ border: '1.5px solid #000000', padding: '7px 5px', textAlign: 'center', fontWeight: '800', color: '#b91c1c' }}>
                    - {discount.toLocaleString('en-IN')}
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
