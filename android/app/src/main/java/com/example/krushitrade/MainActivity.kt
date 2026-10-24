package com.example.krushitrade

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.sp
import com.example.krushitrade.data.FirebaseRepository
import com.example.krushitrade.model.*
import com.example.krushitrade.ui.screens.*
import com.example.krushitrade.ui.theme.GreenPrimary
import com.example.krushitrade.ui.theme.KrushiTradeTheme
import kotlinx.coroutines.launch

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "ડેશબોર્ડ", Icons.Default.Dashboard)
    object Sales : Screen("sales", "નવું બિલ", Icons.Default.Receipt)
    object Purchases : Screen("purchases", "ખરીદી", Icons.Default.ShoppingCart)
    object Stock : Screen("stock", "સ્ટોક", Icons.Default.AllInbox)
    object Farmers : Screen("farmers", "ખેડૂત", Icons.Default.People)
}

class MainActivity : ComponentActivity() {
    private val repository = FirebaseRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KrushiTradeTheme {
                MainApp(repository)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp(repository: FirebaseRepository) {
    val coroutineScope = rememberCoroutineScope()
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Dashboard) }

    // Seed Data
    val initialStock = remember {
        mutableStateListOf(
            StockItem(
                id = "stk_1",
                seedId = "seed_1",
                varietyName = "GJG-22 (મગફળી)",
                batchNo = "LOT-2026/01",
                bagWeightKg = 50.0,
                availableBags = 120,
                availableLooseKg = 25.0,
                totalWeightKg = 6025.0,
                lastPurchaseRate = 122.0
            ),
            StockItem(
                id = "stk_2",
                seedId = "seed_2",
                varietyName = "GJG-23 (અર્ધવેલડી)",
                batchNo = "LOT-2026/02",
                bagWeightKg = 50.0,
                availableBags = 80,
                availableLooseKg = 40.0,
                totalWeightKg = 4040.0,
                lastPurchaseRate = 128.0
            ),
            StockItem(
                id = "stk_3",
                seedId = "seed_3",
                varietyName = "GJ-39 (જીરૂ બિયારણ)",
                batchNo = "LOT-2026/J4",
                bagWeightKg = 30.0,
                availableBags = 24,
                availableLooseKg = 10.0,
                totalWeightKg = 730.0,
                lastPurchaseRate = 380.0
            )
        )
    }

    val initialFarmers = remember {
        mutableStateListOf(
            Farmer(id = "f_1", code = "KH-001", name = "મનસુખભાઈ પટેલ", mobile = "9825123456", village = "વડાલ (જૂનાગઢ)", currentBalance = 12500.0),
            Farmer(id = "f_2", code = "KH-002", name = "ભરતભાઈ આહીર", mobile = "9712345678", village = "ગોંડલ", currentBalance = 0.0),
            Farmer(id = "f_3", code = "KH-003", name = "પ્રવીણભાઈ વાળા", mobile = "9909012345", village = "ધારી (અમરેલી)", currentBalance = 34000.0)
        )
    }

    val initialSales = remember {
        mutableStateListOf(
            SaleInvoice(
                id = "sale_1",
                billNo = "KT-2026-00101",
                billDate = "2026-10-24",
                farmerName = "મનસુખભાઈ પટેલ",
                farmerVillage = "વડાલ",
                farmerMobile = "9825123456",
                items = listOf(
                    SaleItem(varietyName = "GJG-22 (મગફળી)", batchNo = "LOT-2026/01", bags = 2, looseKg = 10.0, totalWeightKg = 110.0, rate = 140.0, itemTotal = 15400.0)
                ),
                subTotal = 15400.0,
                discount = 400.0,
                netAmount = 15000.0,
                paidAmount = 10000.0,
                dueAmount = 5000.0
            )
        )
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                val screens = listOf(Screen.Dashboard, Screen.Sales, Screen.Purchases, Screen.Stock, Screen.Farmers)
                screens.forEach { screen ->
                    NavigationBarItem(
                        selected = currentScreen == screen,
                        onClick = { currentScreen = screen },
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = GreenPrimary,
                            selectedTextColor = GreenPrimary
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Surface(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (currentScreen) {
                Screen.Dashboard -> DashboardScreen(
                    sales = initialSales,
                    stock = initialStock,
                    onNavigateToSales = { currentScreen = Screen.Sales },
                    onNavigateToStock = { currentScreen = Screen.Stock }
                )
                Screen.Sales -> SalesBillingScreen(
                    farmers = initialFarmers,
                    stock = initialStock,
                    onSaveSale = { newSale ->
                        initialSales.add(0, newSale)
                        // Deduct stock locally
                        newSale.items.forEach { item ->
                            val idx = initialStock.indexOfFirst { it.varietyName == item.varietyName && it.batchNo == item.batchNo }
                            if (idx >= 0) {
                                val cur = initialStock[idx]
                                val newTotalKg = (cur.totalWeightKg - item.totalWeightKg).coerceAtLeast(0.0)
                                val newBags = (newTotalKg / cur.bagWeightKg).toInt()
                                val newLoose = newTotalKg % cur.bagWeightKg
                                initialStock[idx] = cur.copy(availableBags = newBags, availableLooseKg = newLoose, totalWeightKg = newTotalKg)
                            }
                        }
                        // Update farmer due
                        val fIdx = initialFarmers.indexOfFirst { it.id == newSale.farmerId }
                        if (fIdx >= 0) {
                            val f = initialFarmers[fIdx]
                            initialFarmers[fIdx] = f.copy(currentBalance = f.currentBalance + newSale.dueAmount)
                        }
                        // Sync with Firebase
                        coroutineScope.launch {
                            repository.saveSaleWithStockDeduction(newSale)
                        }
                    }
                )
                Screen.Purchases -> PurchaseEntryScreen(
                    suppliers = listOf(
                        Supplier(id = "sup_1", companyName = "ગુજરાત બીજ નિગમ", city = "ગાંધીનગર"),
                        Supplier(id = "sup_2", companyName = "જૂનાગઢ સીડ્સ કંપની", city = "જૂનાગઢ")
                    ),
                    seeds = listOf(
                        SeedProduct(id = "seed_1", varietyName = "GJG-22 (મગફળી)", bagWeightKg = 50.0),
                        SeedProduct(id = "seed_2", varietyName = "GJG-23 (અર્ધવેલડી)", bagWeightKg = 50.0),
                        SeedProduct(id = "seed_3", varietyName = "GJ-39 (જીરૂ)", bagWeightKg = 30.0)
                    ),
                    onSavePurchase = { newPur ->
                        newPur.items.forEach { item ->
                            val existingIdx = initialStock.indexOfFirst { it.varietyName == item.varietyName && it.batchNo == item.batchNo }
                            if (existingIdx >= 0) {
                                val cur = initialStock[existingIdx]
                                initialStock[existingIdx] = cur.copy(
                                    availableBags = cur.availableBags + item.bags,
                                    totalWeightKg = cur.totalWeightKg + item.netWeightKg
                                )
                            } else {
                                initialStock.add(
                                    StockItem(
                                        id = "stk_${System.currentTimeMillis()}",
                                        seedId = item.seedId,
                                        varietyName = item.varietyName,
                                        batchNo = item.batchNo,
                                        bagWeightKg = item.bagWeightKg,
                                        availableBags = item.bags,
                                        totalWeightKg = item.netWeightKg,
                                        lastPurchaseRate = item.purchaseRate
                                    )
                                )
                            }
                        }
                        coroutineScope.launch {
                            repository.savePurchaseWithStockIncrease(newPur)
                        }
                        currentScreen = Screen.Stock
                    }
                )
                Screen.Stock -> StockLedgerScreen(stock = initialStock)
                Screen.Farmers -> FarmerMasterScreen(
                    farmers = initialFarmers,
                    onAddFarmer = { newFarmer ->
                        initialFarmers.add(0, newFarmer.copy(id = "f_${System.currentTimeMillis()}"))
                        coroutineScope.launch {
                            repository.addFarmer(newFarmer)
                        }
                    }
                )
            }
        }
    }
}
