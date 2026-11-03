package com.example.krushitrade.data

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.krushitrade.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

data class InitialDataResult(
    val seeds: List<SeedProduct>,
    val parties: List<Party>,
    val stock: List<StockItem>,
    val sales: List<SaleInvoice>,
    val purchases: List<PurchaseRecord>
)

class KrushiApiRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("krushi_prefs", Context.MODE_PRIVATE)

    companion object {
        const val DEFAULT_BASE_URL = "https://krushi.aceglory.in"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_CACHE_INITIAL_DATA = "cache_initial_data"
        private const val TAG = "KrushiApiRepo"
    }

    fun getBaseUrl(): String {
        val url = prefs.getString(KEY_SERVER_URL, DEFAULT_BASE_URL)?.trim() ?: DEFAULT_BASE_URL
        return url.trimEnd('/')
    }

    fun setBaseUrl(url: String) {
        val cleanUrl = url.trim().trimEnd('/')
        prefs.edit().putString(KEY_SERVER_URL, cleanUrl).apply()
    }

    private suspend fun sendHttpRequest(
        endpoint: String,
        method: String = "GET",
        jsonBody: String? = null
    ): String = withContext(Dispatchers.IO) {
        val baseUrl = getBaseUrl()
        val fullUrl = "$baseUrl$endpoint"
        Log.d(TAG, "HTTP $method -> $fullUrl")

        val url = URL(fullUrl)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 15000
        conn.readTimeout = 20000
        conn.setRequestProperty("Accept", "application/json")
        conn.setRequestProperty("User-Agent", "KrushiTrade-AndroidApp/1.0")

        if (jsonBody != null) {
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
                writer.write(jsonBody)
                writer.flush()
            }
        }

        val code = conn.responseCode
        Log.d(TAG, "HTTP $method response code: $code")

        if (code in 200..299) {
            val reader = BufferedReader(InputStreamReader(conn.inputStream, "UTF-8"))
            val response = reader.use { it.readText() }
            response
        } else {
            val errorStream = conn.errorStream ?: conn.inputStream
            val errorResponse = errorStream?.let {
                BufferedReader(InputStreamReader(it, "UTF-8")).use { r -> r.readText() }
            } ?: "HTTP Error $code"
            Log.e(TAG, "HTTP Error ($code): $errorResponse")
            throw Exception("Server Error ($code): $errorResponse")
        }
    }

    suspend fun getInitialData(): Result<InitialDataResult> = withContext(Dispatchers.IO) {
        try {
            val responseStr = sendHttpRequest("/api/initial-data", "GET")
            prefs.edit().putString(KEY_CACHE_INITIAL_DATA, responseStr).apply()
            val parsed = parseInitialDataJson(responseStr)
            Result.success(parsed)
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching initial data: ${e.message}", e)
            val cached = prefs.getString(KEY_CACHE_INITIAL_DATA, null)
            if (!cached.isNullOrEmpty()) {
                try {
                    val parsed = parseInitialDataJson(cached)
                    Result.success(parsed)
                } catch (parseEx: Exception) {
                    Result.failure(e)
                }
            } else {
                Result.failure(e)
            }
        }
    }

    private fun parseInitialDataJson(jsonStr: String): InitialDataResult {
        val root = JSONObject(jsonStr)
        val dataObj = root.optJSONObject("data") ?: JSONObject()

        // Seeds
        val seedsList = mutableListOf<SeedProduct>()
        val seedsArray = dataObj.optJSONArray("seeds") ?: JSONArray()
        for (i in 0 until seedsArray.length()) {
            val s = seedsArray.getJSONObject(i)
            seedsList.add(
                SeedProduct(
                    id = s.optString("id"),
                    varietyName = s.optString("varietyName"),
                    cropType = s.optString("cropType"),
                    company = s.optString("company", "SHREE NANDINI SEEDS"),
                    bagWeightKg = s.optDouble("bagWeightKg", BAG_STD_KG),
                    defaultSaleRatePerMan = s.optDouble("defaultSaleRatePerMan", 2800.0),
                    defaultPurchaseRatePerMan = s.optDouble("defaultPurchaseRatePerMan", 2400.0),
                    minStockAlertBags = s.optInt("minStockAlertBags", 10)
                )
            )
        }

        // Parties
        val partiesList = mutableListOf<Party>()
        val partiesArray = dataObj.optJSONArray("parties") ?: JSONArray()
        for (i in 0 until partiesArray.length()) {
            val p = partiesArray.getJSONObject(i)
            partiesList.add(
                Party(
                    id = p.optString("id"),
                    code = p.optString("code"),
                    partyType = p.optString("partyType", "farmer"),
                    name = p.optString("name"),
                    firmName = p.optString("firmName"),
                    firmId = p.optString("firmId"),
                    mobile = p.optString("mobile"),
                    village = p.optString("village"),
                    creditLimit = p.optDouble("creditLimit", 50000.0),
                    openingBalance = p.optDouble("openingBalance", 0.0),
                    currentBalance = p.optDouble("currentBalance", 0.0),
                    balanceType = p.optString("balanceType", "dr")
                )
            )
        }

        // Stock
        val stockList = mutableListOf<StockItem>()
        val stockArray = dataObj.optJSONArray("stock") ?: JSONArray()
        for (i in 0 until stockArray.length()) {
            val st = stockArray.getJSONObject(i)
            stockList.add(
                StockItem(
                    id = st.optString("id"),
                    seedId = st.optString("seedId"),
                    varietyName = st.optString("varietyName"),
                    bagWeightKg = st.optDouble("bagWeightKg", BAG_STD_KG),
                    availableBags = st.optInt("availableBags", 0),
                    availableLooseKg = st.optDouble("availableLooseKg", 0.0),
                    totalWeightKg = st.optDouble("totalWeightKg", 0.0),
                    totalMan = st.optDouble("totalMan", 0.0),
                    lastPurchaseRate = st.optDouble("lastPurchaseRate", 0.0)
                )
            )
        }

        // Sales
        val salesList = mutableListOf<SaleInvoice>()
        val salesArray = dataObj.optJSONArray("sales") ?: JSONArray()
        for (i in 0 until salesArray.length()) {
            val s = salesArray.getJSONObject(i)
            val itemsArray = s.optJSONArray("items") ?: JSONArray()
            val itemsList = mutableListOf<SaleItem>()
            for (j in 0 until itemsArray.length()) {
                val it = itemsArray.getJSONObject(j)
                itemsList.add(
                    SaleItem(
                        seedId = it.optString("seedId"),
                        varietyName = it.optString("varietyName"),
                        bagWeightKg = it.optDouble("bagWeightKg", BAG_STD_KG),
                        bags = it.optInt("bags", 0),
                        looseKg = it.optDouble("looseKg", 0.0),
                        totalWeightKg = it.optDouble("totalWeightKg", 0.0),
                        totalMan = it.optDouble("totalMan", 0.0),
                        rateUnit = it.optString("rateUnit", "man"),
                        rate = it.optDouble("rate", 0.0),
                        itemTotal = it.optDouble("itemTotal", 0.0)
                    )
                )
            }

            salesList.add(
                SaleInvoice(
                    id = s.optString("id"),
                    billNo = s.optString("billNo"),
                    billDate = s.optString("billDate"),
                    farmerId = if (s.has("partyId") && !s.isNull("partyId")) s.optString("partyId") else s.optString("farmerId"),
                    farmerName = s.optString("farmerName"),
                    farmerMobile = s.optString("farmerMobile"),
                    farmerVillage = s.optString("farmerVillage"),
                    items = itemsList,
                    subTotal = s.optDouble("subTotal", 0.0),
                    majuriAmount = s.optDouble("majuriAmount", 0.0),
                    extraCharges = s.optDouble("extraCharges", 0.0),
                    discount = s.optDouble("discount", 0.0),
                    netAmount = s.optDouble("netAmount", 0.0),
                    paidAmount = s.optDouble("paidAmount", 0.0),
                    dueAmount = s.optDouble("dueAmount", 0.0),
                    paymentMode = s.optString("paymentMode", "cash"),
                    createdBy = s.optString("createdBy")
                )
            )
        }

        // Purchases
        val purchasesList = mutableListOf<PurchaseRecord>()
        val purchasesArray = dataObj.optJSONArray("purchases") ?: JSONArray()
        for (i in 0 until purchasesArray.length()) {
            val p = purchasesArray.getJSONObject(i)
            val itemsArray = p.optJSONArray("items") ?: JSONArray()
            val itemsList = mutableListOf<PurchaseItem>()
            for (j in 0 until itemsArray.length()) {
                val it = itemsArray.getJSONObject(j)
                val rateMan = it.optDouble("ratePerMan", 0.0)
                itemsList.add(
                    PurchaseItem(
                        seedId = it.optString("seedId"),
                        varietyName = it.optString("varietyName"),
                        bagWeightKg = it.optDouble("bagWeightKg", BAG_STD_KG),
                        bags = it.optInt("bags", 0),
                        lastBagKg = it.optDouble("lastBagKg", BAG_STD_KG),
                        netWeightKg = it.optDouble("netWeightKg", 0.0),
                        totalMan = it.optDouble("totalMan", 0.0),
                        ratePerMan = rateMan,
                        purchaseRate = rateMan,
                        itemTotal = it.optDouble("itemTotal", 0.0)
                    )
                )
            }

            purchasesList.add(
                PurchaseRecord(
                    id = p.optString("id"),
                    purchaseType = p.optString("purchaseType", "farmer"),
                    billNo = p.optString("billNo"),
                    purchaseDate = p.optString("purchaseDate"),
                    partyId = p.optString("partyId"),
                    partyName = p.optString("partyName"),
                    village = p.optString("village"),
                    mobile = p.optString("mobile"),
                    firmId = p.optString("firmId"),
                    firmName = p.optString("firmName"),
                    traderId = p.optString("traderId"),
                    traderName = p.optString("traderName"),
                    truckNo = p.optString("truckNo"),
                    truckOwner = p.optString("truckOwner"),
                    items = itemsList,
                    itemsSubTotal = p.optDouble("itemsSubTotal", 0.0),
                    majuriRatePerBag = p.optDouble("majuriRatePerBag", 0.0),
                    majuriAmount = p.optDouble("majuriAmount", 0.0),
                    marketCommission = p.optDouble("marketCommission", 0.0),
                    firmCommission = p.optDouble("firmCommission", 0.0),
                    bardanExpense = p.optDouble("bardanExpense", 0.0),
                    totalExpenses = p.optDouble("totalExpenses", 0.0),
                    netTotal = p.optDouble("netTotal", 0.0),
                    paidAmount = p.optDouble("paidAmount", 0.0),
                    dueAmount = p.optDouble("dueAmount", 0.0),
                    paymentMode = p.optString("paymentMode", "bank"),
                    remarks = p.optString("remarks"),
                    createdBy = p.optString("createdBy")
                )
            )
        }

        return InitialDataResult(seedsList, partiesList, stockList, salesList, purchasesList)
    }

    suspend fun saveParty(party: Party): Result<Party> = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                if (party.id.isNotEmpty()) put("id", party.id)
                put("partyType", party.partyType.ifEmpty { "farmer" })
                put("name", party.name)
                put("firmName", party.firmName)
                put("mobile", party.mobile)
                put("village", party.village)
                put("openingBalance", party.openingBalance)
                put("openingBalanceType", party.balanceType.ifEmpty { "dr" })
                put("balanceType", party.balanceType.ifEmpty { "dr" })
                put("creditLimit", party.creditLimit)
            }

            val resp = sendHttpRequest("/api/parties", "POST", json.toString())
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                val p = root.optJSONObject("party") ?: JSONObject()
                Result.success(
                    party.copy(
                        id = p.optString("id", party.id),
                        code = p.optString("code", party.code),
                        currentBalance = p.optDouble("currentBalance", party.currentBalance)
                    )
                )
            } else {
                Result.failure(Exception(root.optString("error", "Error saving party")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving party: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun saveSale(sale: SaleInvoice): Result<SaleInvoice> = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                if (sale.id.isNotEmpty()) put("id", sale.id)
                put("billNo", sale.billNo)
                put("billDate", sale.billDate.ifEmpty { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) })
                put("farmerId", sale.farmerId)
                put("farmerName", sale.farmerName)
                put("farmerMobile", sale.farmerMobile)
                put("farmerVillage", sale.farmerVillage)
                put("subTotal", sale.subTotal)
                put("majuriAmount", sale.majuriAmount)
                put("extraCharges", sale.extraCharges)
                put("discount", sale.discount)
                put("netAmount", sale.netAmount)
                put("paidAmount", sale.paidAmount)
                put("dueAmount", sale.dueAmount)
                put("paymentMode", sale.paymentMode)
                put("createdBy", if (sale.createdBy.isNotEmpty()) sale.createdBy else "Sub User (Mobile APK)")

                val itemsArr = JSONArray()
                for (it in sale.items) {
                    val itObj = JSONObject().apply {
                        put("seedId", it.seedId)
                        put("varietyName", it.varietyName)
                        put("bagWeightKg", it.bagWeightKg)
                        put("bags", it.bags)
                        put("looseKg", it.looseKg)
                        put("totalWeightKg", it.totalWeightKg)
                        put("totalMan", it.totalMan)
                        put("rateUnit", it.rateUnit)
                        put("rate", it.rate)
                        put("itemTotal", it.itemTotal)
                    }
                    itemsArr.put(itObj)
                }
                put("items", itemsArr)
            }

            val resp = sendHttpRequest("/api/sales", "POST", json.toString())
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                val assignedBillNo = root.optString("billNo", sale.billNo)
                val assignedId = root.optString("saleId", sale.id)
                Result.success(sale.copy(id = assignedId, billNo = assignedBillNo))
            } else {
                Result.failure(Exception(root.optString("error", "Error saving sale")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving sale: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun savePurchase(purchase: PurchaseRecord): Result<PurchaseRecord> = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                if (purchase.id.isNotEmpty()) put("id", purchase.id)
                put("billNo", purchase.billNo)
                put("purchaseDate", purchase.purchaseDate.ifEmpty { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) })
                put("purchaseType", purchase.purchaseType)
                put("partyId", purchase.partyId)
                put("partyName", purchase.partyName)
                put("village", purchase.village)
                put("mobile", purchase.mobile)
                put("firmId", purchase.firmId)
                put("firmName", purchase.firmName)
                put("traderId", purchase.traderId)
                put("traderName", purchase.traderName)
                put("truckNo", purchase.truckNo)
                put("truckOwner", purchase.truckOwner)
                put("itemsSubTotal", purchase.itemsSubTotal)
                put("majuriRatePerBag", purchase.majuriRatePerBag)
                put("majuriAmount", purchase.majuriAmount)
                put("marketCommission", purchase.marketCommission)
                put("firmCommission", purchase.firmCommission)
                put("bardanExpense", purchase.bardanExpense)
                put("totalExpenses", purchase.totalExpenses)
                put("netTotal", purchase.netTotal)
                put("paidAmount", purchase.paidAmount)
                put("dueAmount", purchase.dueAmount)
                put("paymentMode", purchase.paymentMode)
                put("remarks", purchase.remarks)
                put("createdBy", if (purchase.createdBy.isNotEmpty()) purchase.createdBy else "Sub User (Mobile APK)")

                val itemsArr = JSONArray()
                for (it in purchase.items) {
                    val itObj = JSONObject().apply {
                        put("seedId", it.seedId)
                        put("varietyName", it.varietyName)
                        put("bagWeightKg", it.bagWeightKg)
                        put("bags", it.bags)
                        put("lastBagKg", it.lastBagKg)
                        put("netWeightKg", it.netWeightKg)
                        put("totalMan", it.totalMan)
                        put("ratePerMan", it.ratePerMan)
                        put("ratePerKg", if (it.purchaseRate > 0) it.purchaseRate / 20.0 else it.ratePerMan / 20.0)
                        put("itemTotal", it.itemTotal)
                    }
                    itemsArr.put(itObj)
                }
                put("items", itemsArr)
            }

            val resp = sendHttpRequest("/api/purchases", "POST", json.toString())
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                val assignedBillNo = root.optString("billNo", purchase.billNo)
                val assignedId = root.optString("purchaseId", purchase.id)
                Result.success(purchase.copy(id = assignedId, billNo = assignedBillNo))
            } else {
                Result.failure(Exception(root.optString("error", "Error saving purchase")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving purchase: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updatePurchase(purchase: PurchaseRecord): Result<PurchaseRecord> = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                if (purchase.id.isNotEmpty()) put("id", purchase.id)
                put("billNo", purchase.billNo)
                put("purchaseDate", purchase.purchaseDate.ifEmpty { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) })
                put("purchaseType", purchase.purchaseType)
                put("partyId", purchase.partyId)
                put("partyName", purchase.partyName)
                put("village", purchase.village)
                put("mobile", purchase.mobile)
                put("firmId", purchase.firmId)
                put("firmName", purchase.firmName)
                put("traderId", purchase.traderId)
                put("traderName", purchase.traderName)
                put("truckNo", purchase.truckNo)
                put("truckOwner", purchase.truckOwner)
                put("itemsSubTotal", purchase.itemsSubTotal)
                put("majuriRatePerBag", purchase.majuriRatePerBag)
                put("majuriAmount", purchase.majuriAmount)
                put("marketCommission", purchase.marketCommission)
                put("firmCommission", purchase.firmCommission)
                put("bardanExpense", purchase.bardanExpense)
                put("totalExpenses", purchase.totalExpenses)
                put("netTotal", purchase.netTotal)
                put("paidAmount", purchase.paidAmount)
                put("dueAmount", purchase.dueAmount)
                put("paymentMode", purchase.paymentMode)
                put("remarks", purchase.remarks)
                put("createdBy", if (purchase.createdBy.isNotEmpty()) purchase.createdBy else "Sub User (Mobile APK)")

                val itemsArr = JSONArray()
                for (it in purchase.items) {
                    val itObj = JSONObject().apply {
                        put("seedId", it.seedId)
                        put("varietyName", it.varietyName)
                        put("bagWeightKg", it.bagWeightKg)
                        put("bags", it.bags)
                        put("lastBagKg", it.lastBagKg)
                        put("netWeightKg", it.netWeightKg)
                        put("totalMan", it.totalMan)
                        put("ratePerMan", it.ratePerMan)
                        put("ratePerKg", if (it.purchaseRate > 0) it.purchaseRate / 20.0 else it.ratePerMan / 20.0)
                        put("itemTotal", it.itemTotal)
                    }
                    itemsArr.put(itObj)
                }
                put("items", itemsArr)
            }

            val resp = sendHttpRequest("/api/purchases/${purchase.billNo}", "PUT", json.toString())
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                Result.success(purchase)
            } else {
                Result.failure(Exception(root.optString("error", "Error updating purchase")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating purchase: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun deletePurchase(billNo: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val resp = sendHttpRequest("/api/purchases/$billNo", "DELETE")
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                Result.success(true)
            } else {
                Result.failure(Exception(root.optString("error", "Error deleting purchase")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting purchase: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updateSale(sale: SaleInvoice): Result<SaleInvoice> = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                if (sale.id.isNotEmpty()) put("id", sale.id)
                put("billNo", sale.billNo)
                put("billDate", sale.billDate.ifEmpty { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) })
                put("farmerId", sale.farmerId)
                put("farmerName", sale.farmerName)
                put("farmerMobile", sale.farmerMobile)
                put("farmerVillage", sale.farmerVillage)
                put("subTotal", sale.subTotal)
                put("majuriAmount", sale.majuriAmount)
                put("extraCharges", sale.extraCharges)
                put("discount", sale.discount)
                put("netAmount", sale.netAmount)
                put("paidAmount", sale.paidAmount)
                put("dueAmount", sale.dueAmount)
                put("paymentMode", sale.paymentMode)
                put("createdBy", if (sale.createdBy.isNotEmpty()) sale.createdBy else "Sub User (Mobile APK)")

                val itemsArr = JSONArray()
                for (it in sale.items) {
                    val itObj = JSONObject().apply {
                        put("seedId", it.seedId)
                        put("varietyName", it.varietyName)
                        put("bagWeightKg", it.bagWeightKg)
                        put("bags", it.bags)
                        put("looseKg", it.looseKg)
                        put("totalWeightKg", it.totalWeightKg)
                        put("totalMan", it.totalMan)
                        put("rateUnit", it.rateUnit)
                        put("rate", it.rate)
                        put("itemTotal", it.itemTotal)
                    }
                    itemsArr.put(itObj)
                }
                put("items", itemsArr)
            }

            val resp = sendHttpRequest("/api/sales/${sale.billNo}", "PUT", json.toString())
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                Result.success(sale)
            } else {
                Result.failure(Exception(root.optString("error", "Error updating sale")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating sale: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun deleteSale(billNo: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val resp = sendHttpRequest("/api/sales/$billNo", "DELETE")
            val root = JSONObject(resp)
            if (root.optBoolean("success")) {
                Result.success(true)
            } else {
                Result.failure(Exception(root.optString("error", "Error deleting sale")))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting sale: ${e.message}", e)
            Result.failure(e)
        }
    }
}

