# કૃષિ ટ્રેડ (Krushi Trade) – Firebase Firestore Schema Documentation

આ દસ્તાવેજ Krushi Trade એપ્લિકેશનના Firestore Data Model, Fields અને Real-time Relationships ની સંપૂર્ણ વિગતો આપે છે.

---

## ૧. Users Collection (`/users/{uid}`)
Main Admin અને Permission-based Sub Users નું ખાતું.
```json
{
  "uid": "FIREBASE_AUTH_UID",
  "email": "staff1@krushitrade.com",
  "displayName": "રમેશભાઈ પટેલ (સ્ટાફ)",
  "mobile": "9876543210",
  "role": "sub_user", // "admin" અથવા "sub_user"
  "permissions": {
    "farmerMaster": true,      // ખેડૂત વિગતો ઉમેરવી/જોવી
    "supplierMaster": false,   // સપ્લાયર વિગતો
    "seedMaster": true,        // બિયારણ વેરાયટી વિગતો
    "purchaseEntry": false,    // ખરીદી એન્ટ્રી કરવી
    "salesBilling": true,      // બિલ બનાવવું
    "stockManagement": true,   // સ્ટોક જોવો/બદલવો
    "payments": true,          // ઉધાર વસૂલાત નોંધવી
    "reports": false,          // હિસાબી રિપોર્ટ્સ જોવા
    "viewRates": false         // ખરીદી ભાવ છુપાવવો
  },
  "isActive": true,
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

---

## ૨. Farmer / Customer Master (`/farmers/{farmerId}`)
ખેડૂત, ડીલર અને રીટેઈલર ગ્રાહકોની માહિતી.
```json
{
  "farmerId": "FARMER_DOC_ID",
  "code": "F-00101",
  "name": "મનસુખભાઈ કાનજીભાઈ પટેલ",
  "mobile": "9825012345",
  "village": "જૂનાગઢ (વડાલ)",
  "taluka": "જૂનાગઢ",
  "district": "જૂનાગઢ",
  "address": "મુ. વડાલ, સ્ટેશન રોડ",
  "farmerType": "farmer", // "farmer" | "dealer" | "retailer"
  "openingBalance": 0,    // અગાઉનું જૂનું લેણું (+) અથવા જમા (-)
  "currentBalance": 12500, // હાલનું બાકી લેણું (ઉધાર)
  "creditLimit": 50000,   // ઉધાર મર્યાદા (રૂપિયા)
  "notes": "મગફળી અને જીરૂ ના ખેડૂત",
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

---

## ૩. Supplier Master (`/suppliers/{supplierId}`)
બિયારણ ઉત્પાદક કંપનીઓ અને મોટા જથ્થાબંધ વેપારીઓ.
```json
{
  "supplierId": "SUPPLIER_DOC_ID",
  "code": "SUP-012",
  "companyName": "ગુજરાત સીડ્સ કોર્પોરેશન",
  "contactPerson": "ભરતભાઈ શાહ",
  "mobile": "9426098765",
  "city": "અમદાવાદ",
  "address": "GIDC ફેઝ-૨, નરોડા",
  "gstNo": "24AAACG1234F1Z8",
  "openingBalance": 0,
  "currentBalance": 45000, // સપ્લાયરને ચૂકવવાના બાકી
  "createdAt": "TIMESTAMP"
}
```

---

## ૪. Seed Products & Varieties (`/seedProducts/{seedId}`)
બિયારણની વિવિધ જાતો અને પ્રમાણિત પેકિંગ વજન.
```json
{
  "seedId": "SEED_DOC_ID",
  "varietyName": "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
  "cropType": "મગફળી (Groundnut)",
  "company": "જૂનાગઢ કૃષિ યુનિવર્સિટી બિયારણ",
  "bagWeightKg": 50.0, // ૧ બોરી = ૫૦ કિલો
  "hsnCode": "1209",
  "defaultSaleRatePerKg": 140.0,
  "defaultSaleRatePerBag": 7000.0,
  "totalBagsInStock": 85,
  "totalWeightKgInStock": 4250.0,
  "minStockAlertBags": 10,
  "createdAt": "TIMESTAMP"
}
```

---

## ૫. Purchases & Inward Stock (`/purchases/{purchaseId}`)
ખરીદીની એન્ટ્રી જે સ્ટોક અને સપ્લાયર લેજરમાં આપોઆપ વધારો કરે છે.
```json
{
  "purchaseId": "PUR_DOC_ID",
  "invoiceNo": "PUR-2026-089",
  "purchaseDate": "2026-10-24",
  "supplierId": "SUPPLIER_DOC_ID",
  "supplierName": "ગુજરાત સીડ્સ કોર્પોરેશન",
  "items": [
    {
      "seedId": "SEED_DOC_ID",
      "varietyName": "GJG-22 (મગફળી)",
      "batchNo": "LOT-2026/04",
      "bagWeightKg": 50.0,
      "bags": 40,
      "netWeightKg": 2000.0,
      "ratePerBag": 6200.0,
      "ratePerKg": 124.0,
      "itemTotal": 248000.0
    }
  ],
  "totalAmount": 248000.0,
  "paidAmount": 100000.0,
  "dueAmount": 148000.0,
  "paymentMode": "bank", // cash | bank | upi | credit
  "remarks": "ટ્રાન્સપોર્ટ બિલ્ટી નં. 556",
  "createdByUid": "AUTH_UID",
  "createdByName": "Admin",
  "createdAt": "TIMESTAMP"
}
```

---

## ૬. Sales & Simple Billing (`/sales/{saleId}`)
ખેડૂત કે ગ્રાહકને સાદું બિલ (Simple Bill), સ્ટોક ઘટાડો અને ઉધાર-જમા.
```json
{
  "saleId": "SALE_DOC_ID",
  "billNo": "KT-2026-00452",
  "billDate": "2026-10-24",
  "billType": "simple_bill",
  "farmerId": "FARMER_DOC_ID",
  "farmerName": "મનસુખભાઈ કાનજીભાઈ પટેલ",
  "farmerMobile": "9825012345",
  "farmerVillage": "વડાલ (જૂનાગઢ)",
  "saleCategory": "retail", // "retail" અથવા "wholesale"
  "items": [
    {
      "seedId": "SEED_DOC_ID",
      "varietyName": "GJG-22 (મગફળી)",
      "batchNo": "LOT-2026/04",
      "bagWeightKg": 50.0,
      "bags": 2,          // ૨ આખી બોરી
      "looseKg": 15.0,    // ૧૫ કિલો છૂટક
      "totalWeightKg": 115.0, // (૨ * ૫૦) + ૧૫ = ૧૧૫ કિલો
      "rateUnit": "kg",   // "kg" અથવા "bag"
      "rate": 140.0,      // રૂ. ૧૪૦ પ્રતિ કિલો
      "itemTotal": 16100.0
    }
  ],
  "subTotal": 16100.0,
  "discount": 100.0,
  "netAmount": 16000.0,
  "paidAmount": 10000.0,
  "dueAmount": 6000.0,   // બાકી રકમ (ઉધાર) ખેડૂતના ખાતામાં ઉમેરાશે
  "paymentMode": "cash_and_credit", // "cash", "upi", "credit", "partial"
  "remarks": "૧૫ કિલો છૂટક આપ્યું",
  "status": "completed", // "completed", "cancelled"
  "createdByUid": "AUTH_UID",
  "createdByName": "રમેશભાઈ (સ્ટાફ)",
  "createdAt": "TIMESTAMP"
}
```

---

## ૭. Live Stock Ledger (`/stockLedger/{stockId}`)
દરેક બિયારણ અને બેચ નંબર દીઠ ઉપલબ્ધ બોરી અને કિલો નો જીવંત સ્ટોક.
```json
{
  "stockId": "SEEDID_BATCHNO",
  "seedId": "SEED_DOC_ID",
  "varietyName": "GJG-22 (મગફળી)",
  "batchNo": "LOT-2026/04",
  "bagWeightKg": 50.0,
  "availableBags": 38,
  "availableLooseKg": 35.0,
  "totalAvailableKg": 1935.0,
  "lastPurchaseRate": 124.0,
  "lastUpdated": "TIMESTAMP"
}
```

---

## ૮. Payments & Jama-Udhar (`/payments/{paymentId}`)
ખેડૂત કે સપ્લાયર પાસેથી મળેલ કે ચૂકવેલ રોકડ / UPI / બેંક જમા-ઉધાર.
```json
{
  "paymentId": "PAY_DOC_ID",
  "receiptNo": "REC-2026-118",
  "date": "2026-10-24",
  "partyType": "farmer", // "farmer" અથવા "supplier"
  "partyId": "FARMER_DOC_ID",
  "partyName": "મનસુખભાઈ કાનજીભાઈ પટેલ",
  "type": "receipt",    // "receipt" (આવક/વસૂલાત) અથવા "payment" (ચુકવણી)
  "amount": 5000.0,
  "paymentMode": "upi", // "cash", "upi", "bank"
  "referenceNo": "UPI/42881920192",
  "remarks": "બાકી ઉધાર પેટે જમા લીધા",
  "recordedByUid": "AUTH_UID",
  "createdAt": "TIMESTAMP"
}
```
