# 🗄️ Krushi Trade (કૃષિ ટ્રેડ) - PostgreSQL Database Documentation

આ ડિરેક્ટરી **Krushi Trade (SHREE NANDINI SEEDS)** ના PostgreSQL ડેટાબેઝનું સંપૂર્ણ સેટઅપ, સ્કીમા, ઇન્ડેક્સ અને સીડ ડેટા ધરાવે છે.

---

## 📌 ડેટાબેઝ કનેક્શન વિગતો (Connection Details)

| Parameter | Value |
| :--- | :--- |
| **Host** | `127.0.0.1` / `localhost` |
| **Port** | `5432` |
| **Database** | `krushi_trade` |
| **Username** | `gtu_admin` |
| **Password** | `password` |
| **Connection URI** | `postgresql://gtu_admin:password@localhost:5432/krushi_trade` |
| **Cloudflare Tunnel (Remote)** | `tcp://db.aceglory.in:5432` |

---

## 🚀 ઝડપી કમાન્ડ્સ (Quick Commands)

### ૧. ડેટાબેઝ & સ્કીમા ફરી સેટઅપ કરવા (Setup / Reset):
```bash
/home/gtu-itr/krushi-tred/database/setup_db.sh
```

### ૨. PostgreSQL CLI (psql) ઓપન કરવા:
```bash
/home/gtu-itr/krushi-tred/database/psql.sh
```

---

## 📑 ટેબલ્સ અને એપ્લિકેશન લોજિક (Tables & App Logic)

### ૧. `users` (સ્ટાફ યુઝર અને પરવાનગીઓ)
- **હેતુ**: મુખ્ય એડમિન અને સબ-યુઝર લોગિન તથા મોડ્યુલ પરવાનગીઓ (JSONB).
- **કી કૉલમ્સ**: `id`, `email`, `password_hash`, `display_name`, `role`, `permissions`, `is_active`.

### ૨. `seed_varieties` (બિયારણ માસ્ટર)
- **હેતુ**: બિયારણની જાતો, પ્રમાણિત ૩૫ કિલો બોરી વજન અને પ્રતિ મણ (૨૦ કિલો) ખરીદી-વેચાણ ભાવ.
- **કી કૉલમ્સ**: `id`, `variety_name`, `crop_type`, `company`, `bag_weight_kg`, `default_purchase_rate_per_man`, `default_sale_rate_per_man`, `default_sale_rate_per_bag`, `default_sale_rate_per_kg`.

### ૩. `parties` (પાર્ટી માસ્ટર)
- **હેતુ**: ખેડૂતો (`farmer`), માર્કેટ પેઢીઓ (`firm`), દલાલ/વેપારીઓ (`trader`) અને ટ્રાન્સપોર્ટરો (`transporter`).
- **કી કૉલમ્સ**: `id`, `party_type`, `code`, `name`, `firm_name`, `firm_id`, `mobile`, `village`, `opening_balance`, `balance_type`, `current_balance`, `credit_limit`.

### ૪. `stock_ledger` (જીવંત સ્ટોક)
- **હેતુ**: હાજર આખી બોરીઓ અને છૂટક કિલોનો રિયલ-ટાઇમ સ્ટોક.
- **કી કૉલમ્સ**: `seed_id`, `variety_name`, `available_bags`, `available_loose_kg`, `total_weight_kg` (Stored Generated), `total_man` (Stored Generated), `last_purchase_rate`.

### ૫. `purchases` & `purchase_items` (બિયારણ ખરીદી)
- **હેતુ**: ખેડૂત કે માર્કેટ પેઢી પાસેથી ખરીદી બિલ, મજૂરી, કમિશન, બારદાન ખર્ચ અને ચુકવણી.
- **કી કૉલમ્સ**: `bill_no`, `purchase_date`, `party_id`, `truck_no`, `items_sub_total`, `majuri_amount`, `net_total`, `paid_amount`, `due_amount`.

### ૬. `sales` & `sale_items` (વેચાણ / સાદું બિલ)
- **હેતુ**: ગ્રાહક/ખેડૂતને સાદું બિલ (બોરી + છૂટક કિલો), મજૂરી, ડિસ્કાઉન્ટ અને બાકી ઉધાર ટ્રેકિંગ.
- **કી કૉલમ્સ**: `bill_no`, `bill_date`, `party_id`, `farmer_name`, `net_amount`, `paid_amount`, `due_amount`, `payment_mode`.

### ૭. `party_transactions` (પાર્ટી ખાતાવહી લેજર)
- **હેતુ**: ખેડૂત કે પેઢીના ખાતામાં થતી દરેક જમા-ઉધાર (Debit/Credit) એન્ટ્રી.
- **કી કૉલમ્સ**: `party_id`, `date`, `voucher_no`, `voucher_type`, `debit`, `credit`, `running_balance`, `bill_id`.

### ૮. `rojmel` (દૈનિક રોજમેળ - કેશ અને બેંક બુક)
- **હેતુ**: દિવસ દરમિયાન રોકડ (`cash`) કે બેંક (`bank`) માં થયેલી આવક (Credit) અને જાવક (Debit).
- **કી કૉલમ્સ**: `date`, `time`, `voucher_no`, `account`, `debit`, `credit`, `payment_mode`.

### ૯. `payments` (વાઉચર એન્ટ્રી)
- **હેતુ**: રોકડ/UPI/બેંક દ્વારા મળેલ વસૂલાત (Receipt) અથવા ચુકવણી (Payment).
- **કી કૉલમ્સ**: `receipt_no`, `date`, `party_id`, `type`, `amount`, `payment_mode`, `reference_no`.

---

## ⚡ સ્પીડ અને પરફોર્મન્સ ઇન્ડેક્સ (Indexes)

1. **Party Statement Speed**: `idx_ptx_party_date` on `party_transactions(party_id, date DESC)` – ખાતાવહી સ્ટેટમેન્ટ મિલીસેકન્ડમાં લોડ થાય છે.
2. **Daily Rojmel Speed**: `idx_rojmel_date` અને `idx_rojmel_account` on `rojmel(date DESC, account)`.
3. **Due Amount Tracking**: શરતી ઇન્ડેક્સ (Partial Index) `idx_purchases_due_amount` અને `idx_sales_due_amount` જ્યાં `due_amount > 0` હોય.
4. **Party Search**: `idx_parties_mobile`, `idx_parties_name`, `idx_parties_code`, `idx_parties_type`.

---

## 📊 તૈયાર ડેટાબેઝ વ્યુઝ (Database Views)

- `view_current_stock`: સ્ટોક બોરી, કિલો, મણ અને અંદાજિત કિંમત સાથે લો-સ્ટોક એલર્ટ.
- `view_party_outstanding_summary`: દરેક પાર્ટીનું કુલ ઉધાર, કુલ જમા અને વર્તમાન નેટ બાકી લેણું.
- `view_today_dashboard_metrics`: આજના ડેશબોર્ડના તમામ આંકડા (ખેડૂતો, સ્ટોક, આજનું વેચાણ, રોકડ વસૂલાત).
