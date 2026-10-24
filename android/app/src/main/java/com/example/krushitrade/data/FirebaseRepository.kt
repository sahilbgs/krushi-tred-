package com.example.krushitrade.data

import com.example.krushitrade.model.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

class FirebaseRepository {
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }
    private val db: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }

    // ૧. વપરાશકર્તા પ્રોફાઇલ મેળવવી
    suspend fun getUserProfile(uid: String): UserProfile? {
        return try {
            val doc = db.collection("users").document(uid).get().await()
            doc.toObject(UserProfile::class.java)
        } catch (e: Exception) {
            // Fallback default admin profile
            UserProfile(
                uid = uid,
                email = "admin@krushitrade.com",
                displayName = "મુખ્ય સંચાલક (Admin)",
                role = "admin"
            )
        }
    }

    // ૨. ખેડૂત ઉમેરવો
    suspend fun addFarmer(farmer: Farmer): Result<Boolean> {
        return try {
            val docRef = db.collection("farmers").document()
            val newFarmer = farmer.copy(id = docRef.id)
            docRef.set(newFarmer).await()
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ૩. વેચાણ બિલ બનાવવું & સ્ટોક ઘટાડવો (Firestore Transaction)
    suspend fun saveSaleWithStockDeduction(sale: SaleInvoice): Result<SaleInvoice> {
        return try {
            val saleDoc = db.collection("sales").document()
            val finalSale = sale.copy(
                id = saleDoc.id,
                billNo = "KT-${SimpleDateFormat("yyyyMMdd-HHmm", Locale.US).format(Date())}"
            )

            db.runTransaction { transaction ->
                // દરેક આઈટમ માટે સ્ટોક ઘટાડો
                for (item in finalSale.items) {
                    val stockRef = db.collection("stockLedger").document(item.seedId + "_" + item.batchNo)
                    val snapshot = transaction.get(stockRef)

                    if (snapshot.exists()) {
                        val currentStock = snapshot.toObject(StockItem::class.java)
                        if (currentStock != null) {
                            val soldKg = (item.bags * currentStock.bagWeightKg) + item.looseKg
                            val remTotalKg = (currentStock.totalWeightKg - soldKg).coerceAtLeast(0.0)
                            val remBags = (remTotalKg / currentStock.bagWeightKg).toInt()
                            val remLoose = remTotalKg % currentStock.bagWeightKg

                            transaction.update(
                                stockRef,
                                "availableBags", remBags,
                                "availableLooseKg", remLoose,
                                "totalWeightKg", remTotalKg
                            )
                        }
                    }
                }

                // ખેડૂતના ખાતામાં બાકી રકમ (ઉધાર) ઉમેરો
                if (finalSale.dueAmount > 0 && finalSale.farmerId.isNotEmpty()) {
                    val farmerRef = db.collection("farmers").document(finalSale.farmerId)
                    val farmerSnap = transaction.get(farmerRef)
                    if (farmerSnap.exists()) {
                        val curBal = farmerSnap.getDouble("currentBalance") ?: 0.0
                        transaction.update(farmerRef, "currentBalance", curBal + finalSale.dueAmount)
                    }
                }

                // બિલ સેવ કરો
                transaction.set(saleDoc, finalSale)
            }.await()

            Result.success(finalSale)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ૪. ખરીદી સેવ કરવી & સ્ટોક વધારવો
    suspend fun savePurchaseWithStockIncrease(purchase: PurchaseRecord): Result<Boolean> {
        return try {
            val purchaseDoc = db.collection("purchases").document()
            val finalPur = purchase.copy(id = purchaseDoc.id)

            db.runTransaction { transaction ->
                for (item in finalPur.items) {
                    val stockDocId = item.seedId + "_" + item.batchNo
                    val stockRef = db.collection("stockLedger").document(stockDocId)
                    val snapshot = transaction.get(stockRef)

                    if (snapshot.exists()) {
                        val cur = snapshot.toObject(StockItem::class.java)!!
                        val newBags = cur.availableBags + item.bags
                        val newTotalKg = cur.totalWeightKg + item.netWeightKg
                        val newLoose = newTotalKg - (newBags * cur.bagWeightKg)

                        transaction.update(
                            stockRef,
                            "availableBags", newBags,
                            "availableLooseKg", newLoose.coerceAtLeast(0.0),
                            "totalWeightKg", newTotalKg,
                            "lastPurchaseRate", item.purchaseRate
                        )
                    } else {
                        val newStock = StockItem(
                            id = stockDocId,
                            seedId = item.seedId,
                            varietyName = item.varietyName,
                            batchNo = item.batchNo,
                            bagWeightKg = item.bagWeightKg,
                            availableBags = item.bags,
                            availableLooseKg = 0.0,
                            totalWeightKg = item.netWeightKg,
                            lastPurchaseRate = item.purchaseRate
                        )
                        transaction.set(stockRef, newStock)
                    }
                }

                transaction.set(purchaseDoc, finalPur)
            }.await()

            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
