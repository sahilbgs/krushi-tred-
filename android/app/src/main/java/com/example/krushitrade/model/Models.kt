package com.example.krushitrade.model

// Standard Constants for SHREE NANDINI SEEDS
const val BAG_STD_KG = 35.0 // 1 Bag = 35 KG standard
const val MAN_STD_KG = 20.0 // 1 Man = 20 KG standard

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val mobile: String = "",
    val role: String = "sub_user", // "admin" or "sub_user"
    val company: String = "SHREE NANDINI SEEDS",
    val permissions: Map<String, Boolean> = mapOf(
        "salesBilling" to true,
        "farmerMaster" to true,
        "partyMaster" to true,
        "stockManagement" to true,
        "payments" to true,
        "purchaseEntry" to true,
        "khataBook" to true,
        "rojmel" to true,
        "reports" to false,
        "userManagement" to false // Main Admin only
    )
)

data class Party(
    val id: String = "",
    val code: String = "",
    val partyType: String = "farmer", // farmer | firm | trader | truck_owner | other
    val name: String = "",
    val firmName: String = "",
    val firmId: String = "",
    val mobile: String = "",
    val village: String = "",
    val openingBalance: Double = 0.0,
    val currentBalance: Double = 0.0,
    val balanceType: String = "dr" // dr (લેવાના) | cr (આપવાના)
)

// Legacy Farmer & Supplier models for compatibility
typealias Farmer = Party
typealias Supplier = Party

data class SeedProduct(
    val id: String = "",
    val varietyName: String = "",
    val cropType: String = "",
    val company: String = "SHREE NANDINI SEEDS",
    val bagWeightKg: Double = BAG_STD_KG, // 35 KG
    val defaultSaleRatePerMan: Double = 2800.0,
    val defaultPurchaseRatePerMan: Double = 2400.0,
    val minStockAlertBags: Int = 10
)

data class StockItem(
    val id: String = "",
    val seedId: String = "",
    val varietyName: String = "",
    val bagWeightKg: Double = BAG_STD_KG, // 35 KG
    val availableBags: Int = 0,
    val availableLooseKg: Double = 0.0,
    val totalWeightKg: Double = 0.0,
    val totalMan: Double = 0.0,
    val lastPurchaseRate: Double = 0.0
)

data class SaleItem(
    val seedId: String = "",
    val varietyName: String = "",
    val bagWeightKg: Double = BAG_STD_KG,
    val bags: Int = 0,
    val looseKg: Double = 0.0,
    val totalWeightKg: Double = 0.0,
    val totalMan: Double = 0.0,
    val rateUnit: String = "man",
    val rate: Double = 0.0,
    val itemTotal: Double = 0.0
)

data class SaleInvoice(
    val id: String = "",
    val billNo: String = "",
    val billDate: String = "",
    val farmerId: String = "",
    val farmerName: String = "",
    val farmerMobile: String = "",
    val farmerVillage: String = "",
    val items: List<SaleItem> = emptyList(),
    val subTotal: Double = 0.0,
    val majuriAmount: Double = 0.0,
    val extraCharges: Double = 0.0,
    val discount: Double = 0.0,
    val netAmount: Double = 0.0,
    val paidAmount: Double = 0.0,
    val dueAmount: Double = 0.0,
    val paymentMode: String = "cash",
    val createdBy: String = ""
)

data class PurchaseItem(
    val seedId: String = "",
    val varietyName: String = "",
    val bags: Int = 0,
    val lastBagKg: Double = BAG_STD_KG, // 0 to 35 KG
    val netWeightKg: Double = 0.0, // ((bags - 1) * 35) + lastBagKg
    val totalMan: Double = 0.0, // netWeightKg / 20
    val ratePerMan: Double = 0.0, // ₹ પ્રતિ મણ (₹/મણ)
    val itemTotal: Double = 0.0 // totalMan * ratePerMan
)

data class PurchaseRecord(
    val id: String = "",
    val purchaseType: String = "farmer", // "farmer" (સીધા ખેડૂત પાસેથી) or "market" (માર્કેટ પેઢી પાસેથી)
    val billNo: String = "",
    val purchaseDate: String = "",
    val partyId: String = "",
    val partyName: String = "",
    val village: String = "",
    val mobile: String = "",
    val firmId: String = "",
    val firmName: String = "",
    val traderId: String = "",
    val traderName: String = "",
    val truckNo: String = "",
    val truckOwner: String = "",
    val items: List<PurchaseItem> = emptyList(),
    val itemsSubTotal: Double = 0.0,
    val majuriRatePerBag: Double = 0.0,
    val majuriAmount: Double = 0.0,
    val marketCommission: Double = 0.0,
    val firmCommission: Double = 0.0,
    val bardanExpense: Double = 0.0,
    val totalExpenses: Double = 0.0,
    val netTotal: Double = 0.0,
    val paidAmount: Double = 0.0,
    val dueAmount: Double = 0.0,
    val paymentMode: String = "bank",
    val remarks: String = "",
    val createdBy: String = ""
)

data class PartyTransaction(
    val id: String = "",
    val date: String = "",
    val time: String = "",
    val partyId: String = "",
    val partyName: String = "",
    val partyType: String = "farmer",
    val voucherNo: String = "",
    val voucherType: String = "purchase", // purchase | sale | receipt | payment | journal
    val particulars: String = "",
    val varietyName: String = "",
    val bags: Int = 0,
    val weightKg: Double = 0.0,
    val totalMan: Double = 0.0,
    val ratePerMan: Double = 0.0,
    val debit: Double = 0.0,
    val credit: Double = 0.0,
    val paymentMode: String = "",
    val remarks: String = ""
)

data class RojmelEntry(
    val id: String = "",
    val date: String = "",
    val time: String = "",
    val voucherNo: String = "",
    val voucherType: String = "",
    val partyName: String = "",
    val particulars: String = "",
    val varietyName: String = "",
    val bags: Int = 0,
    val weightKg: Double = 0.0,
    val totalMan: Double = 0.0,
    val credit: Double = 0.0,
    val debit: Double = 0.0,
    val account: String = "cash",
    val paymentMode: String = "cash",
    val remarks: String = ""
)
