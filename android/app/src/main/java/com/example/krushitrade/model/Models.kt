package com.example.krushitrade.model

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val mobile: String = "",
    val role: String = "sub_user", // "admin" or "sub_user"
    val permissions: Map<String, Boolean> = mapOf(
        "salesBilling" to true,
        "farmerMaster" to true,
        "stockManagement" to true,
        "payments" to true,
        "purchaseEntry" to false,
        "reports" to false
    )
)

data class Farmer(
    val id: String = "",
    val code: String = "",
    val name: String = "",
    val mobile: String = "",
    val village: String = "",
    val taluka: String = "",
    val farmerType: String = "farmer", // farmer | dealer | retailer
    val openingBalance: Double = 0.0,
    val currentBalance: Double = 0.0,
    val creditLimit: Double = 50000.0
)

data class Supplier(
    val id: String = "",
    val code: String = "",
    val companyName: String = "",
    val contactPerson: String = "",
    val mobile: String = "",
    val city: String = "",
    val currentBalance: Double = 0.0
)

data class SeedProduct(
    val id: String = "",
    val varietyName: String = "",
    val cropType: String = "",
    val company: String = "",
    val bagWeightKg: Double = 50.0,
    val defaultSaleRatePerKg: Double = 140.0,
    val defaultSaleRatePerBag: Double = 7000.0,
    val minStockAlertBags: Int = 10
)

data class StockItem(
    val id: String = "",
    val seedId: String = "",
    val varietyName: String = "",
    val batchNo: String = "",
    val bagWeightKg: Double = 50.0,
    val availableBags: Int = 0,
    val availableLooseKg: Double = 0.0,
    val totalWeightKg: Double = 0.0,
    val lastPurchaseRate: Double = 0.0
)

data class SaleItem(
    val seedId: String = "",
    val varietyName: String = "",
    val batchNo: String = "",
    val bagWeightKg: Double = 50.0,
    val bags: Int = 0,
    val looseKg: Double = 0.0,
    val totalWeightKg: Double = 0.0,
    val rateUnit: String = "kg",
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
    val batchNo: String = "",
    val bagWeightKg: Double = 50.0,
    val bags: Int = 0,
    val netWeightKg: Double = 0.0,
    val rateType: String = "bag",
    val purchaseRate: Double = 0.0,
    val itemTotal: Double = 0.0
)

data class PurchaseRecord(
    val id: String = "",
    val invoiceNo: String = "",
    val purchaseDate: String = "",
    val supplierId: String = "",
    val supplierName: String = "",
    val items: List<PurchaseItem> = emptyList(),
    val totalAmount: Double = 0.0,
    val paidAmount: Double = 0.0,
    val dueAmount: Double = 0.0,
    val paymentMode: String = "bank",
    val createdBy: String = ""
)
