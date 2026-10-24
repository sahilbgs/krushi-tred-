# 🌱 કૃષિ ટ્રેડ (Krushi Trade) – સંપૂર્ણ સેટઅપ અને માર્ગદર્શિકા

**Seeds Purchase, Sales, Billing & Stock Management System**
(Android App + Web Admin Panel + Firebase Firestore)

---

## ૧. પ્રોજેક્ટ માળખું (Project Structure)

આ પ્રોજેક્ટમાં તમામ જરૂરી કોડ અને રૂપરેખા નીચે મુજબ તૈયાર કરેલી છે:

```text
krushi-tred/
├── firebase/
│   ├── firestore.rules       # Main Admin & Sub User સુરક્ષા નિયમો
│   ├── firestore.indexes.json # કમ્પાઉન્ડ ઇન્ડેક્સ
│   └── schema_guide.md       # સંપૂર્ણ ડેટાબેઝ મોડેલ દસ્તાવેજ
├── web/                      # React + Vite Web Admin Panel
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, SimpleBillModal
│   │   ├── pages/            # Dashboard, Billing, Purchase, Stock, Farmers, Users, Reports
│   │   ├── context/          # AuthContext, DataContext
│   │   └── firebase.js       # Firebase SDK ઈનિશિયલાઈઝેશન
│   ├── package.json
│   └── vite.config.js
└── android/                  # Android Kotlin + Jetpack Compose App
    ├── app/
    │   ├── src/main/java/com/example/krushitrade/
    │   │   ├── model/Models.kt
    │   │   ├── data/FirebaseRepository.kt
    │   │   ├── ui/screens/   # Dashboard, SalesBilling, StockLedger, FarmerMaster
    │   │   └── MainActivity.kt
    │   └── build.gradle.kts
    └── build.gradle.kts
```

---

## ૨. વેબ એડમિન પેનલ (Web Admin Panel) કેવી રીતે ચલાવવી

૧. કમ્પ્યુટરમાં Terminal અથવા PowerShell ખોલો અને `web` ફોલ્ડરમાં જાઓ:
```bash
cd "c:\Users\sahil\OneDrive\Desktop\krushi tred\web"
```

૨. ડેવલપમેન્ટ સર્વર શરૂ કરવા માટે રન કરો:
```bash
npm run dev
```

૩. બ્રાઉઝરમાં ખોલો:
👉 **`http://localhost:3000`**

૪. **ઝડપી ડેમો ટેસ્ટિંગ:**
- લૉગિન પેજ પર **"Main Admin"** બટન દબાવવાથી સંચાલક તરીકે લૉગિન થશે.
- **"Sub User"** બટન દબાવવાથી સ્ટાફ યુઝર તરીકે મર્યાદિત પરવાનગીઓ સાથે લૉગિન થશે.
- તમે ઉપર નેવબારમાંથી ગમે ત્યારે ૧-ક્લિકમાં રોલ સ્વિચ કરીને ટેસ્ટ કરી શકો છો.

---

## ૩. Android App કેવી રીતે ચલાવવી

૧. **Android Studio** ખોલો.
૨. **Open** પર ક્લિક કરી `"c:\Users\sahil\OneDrive\Desktop\krushi tred\android"` ફોલ્ડર પસંદ કરો.
૩. તમારી Firebase Console માંથી ડાઉનલોડ કરેલ **`google-services.json`** ફાઇલને આ જગ્યાએ મૂકો:
   `android/app/google-services.json`
   *(નોંધ: આ પ્રોજેક્ટનું પેકેજ નેમ `com.example.krushitrade` રાખેલું છે).*
૪. **Sync Project with Gradle Files** બટન દબાવો.
૫. તમારા ફોન અથવા એમ્યુલેટરમાં Run (▶) દબાવો.

---

## ૪. Firebase Firestore સુરક્ષા નિયમો (Security Rules)

Firebase Console માં જઈને:
1. **Firestore Database** -> **Rules** ટેબ ખોલો.
2. `firebase/firestore.rules` માંનો સંપૂર્ણ કોડ ત્યાં પેસ્ટ કરી **Publish** કરો.
3. આ નિયમો સુનિશ્ચિત કરે છે કે:
   - સ્ટાફ (Sub User) માત્ર તેને મળેલી પરવાનગીઓ મુજબ જ ડેટા બદલી શકે.
   - ઓડિટ લોગ કોઈ ડિલીટ ન કરી શકે.
   - ખરીદી અને વેચાણ ભાવ ગુપ્ત રાખી શકાય.

---

## ૫. બોરી અને કિલો સ્ટોક ગણતરી (Stock Formula)

એપમાં બોરી અને છૂટક કિલોનું સચોટ સંચાલન નીચે મુજબ થાય છે:
- **ખરીદી વખતે (Purchase Inward):**
  $$\text{કુલ કિલો} = (\text{બોરીની સંખ્યા} \times \text{૧ બોરીનું વજન}) + \text{નેટ વજન}$$
  સ્ટોકમાં બોરી અને કિલો બંને આપોઆપ વધે છે.

- **વેચાણ વખતે (Sales Billing):**
  ખેડૂતને ૨ બોરી અને ૧૫ કિલો છૂટક આપ્યું હોય તો:
  $$\text{વેચાણ વજન} = (૨ \times ૫૦) + ૧૫ = ૧૧૫ \text{ kg}$$
  સ્ટોકમાંથી ૧૧૫ કિલો બાદ થાય છે અને બાકી રહેલી આખી બોરી તથા છૂટક કિલોની આપોઆપ પુનઃગણતરી થાય છે.

---

## ૬. સાદું બિલ (Simple Bill) & WhatsApp શેરિંગ

- બિલ બનતાં જ સ્ક્રીન પર ગુજરાતીમાં પ્રિન્ટેબલ બિલ ખૂલશે.
- **વોટ્સએપ પર મોકલો:** ૧-ક્લિકમાં ખેડૂતના વોટ્સએપ પર સંપૂર્ણ બિલ વિગતો (બિલ નં, બોરી, કિલો, રકમ, જમા અને બાકી ઉધાર) ગુજરાતી મેસેજ તરીકે મોકલાશે.
- **પ્રિન્ટ:** A4 અથવા 80mm થર્મલ પ્રિન્ટર બંને પર સ્પષ્ટ ગુજરાતીમાં પ્રિન્ટ થશે.
