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

    // Seed Data (બિયારણની જાતો સાચવી રાખેલ છે - સ્ટોક શૂન્ય છે)
    val initialStock = remember {
        mutableStateListOf(
            StockItem(id = "stk_1", seedId = "seed_1", varietyName = "GJG-22", bagWeightKg = 35.0, availableBags = 0, availableLooseKg = 0.0, totalWeightKg = 0.0, totalMan = 0.0, lastPurchaseRate = 2400.0),
            StockItem(id = "stk_2", seedId = "seed_2", varietyName = "GJG-23", bagWeightKg = 35.0, availableBags = 0, availableLooseKg = 0.0, totalWeightKg = 0.0, totalMan = 0.0, lastPurchaseRate = 2450.0),
            StockItem(id = "stk_3", seedId = "seed_3", varietyName = "GG-20", bagWeightKg = 35.0, availableBags = 0, availableLooseKg = 0.0, totalWeightKg = 0.0, totalMan = 0.0, lastPurchaseRate = 2350.0),
            StockItem(id = "stk_4", seedId = "seed_4", varietyName = "GJ-39", bagWeightKg = 35.0, availableBags = 0, availableLooseKg = 0.0, totalWeightKg = 0.0, totalMan = 0.0, lastPurchaseRate = 7600.0),
            StockItem(id = "stk_5", seedId = "seed_5", varietyName = "GW-496", bagWeightKg = 35.0, availableBags = 0, availableLooseKg = 0.0, totalWeightKg = 0.0, totalMan = 0.0, lastPurchaseRate = 820.0)
        )
    }

    val initialFarmers = remember {
        mutableStateListOf<Farmer>()
    }

    val initialSales = remember {
        mutableStateListOf<SaleInvoice>()
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
                            val idx = initialStock.indexOfFirst { it.seedId == item.seedId || it.varietyName == item.varietyName }
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
                    farmers = initialFarmers,
                    firms = emptyList(),
                    traders = emptyList(),
                    seeds = listOf(
                        SeedProduct(id = "seed_1", varietyName = "GJG-22", cropType = "મગફળી", bagWeightKg = 35.0, defaultPurchaseRatePerMan = 2400.0),
                        SeedProduct(id = "seed_2", varietyName = "GJG-23", cropType = "મગફળી", bagWeightKg = 35.0, defaultPurchaseRatePerMan = 2450.0),
                        SeedProduct(id = "seed_3", varietyName = "GG-20", cropType = "મગફળી", bagWeightKg = 35.0, defaultPurchaseRatePerMan = 2350.0),
                        SeedProduct(id = "seed_4", varietyName = "GJ-39", cropType = "જીરૂ", bagWeightKg = 35.0, defaultPurchaseRatePerMan = 7600.0),
                        SeedProduct(id = "seed_5", varietyName = "GW-496", cropType = "ઘઉં", bagWeightKg = 35.0, defaultPurchaseRatePerMan = 820.0)
                    ),
                    onSavePurchase = { newPur ->
                        newPur.items.forEach { item ->
                            val existingIdx = initialStock.indexOfFirst { it.seedId == item.seedId || it.varietyName == item.varietyName }
                            if (existingIdx >= 0) {
                                val cur = initialStock[existingIdx]
                                val newKg = cur.totalWeightKg + item.netWeightKg
                                val newBags = cur.availableBags + item.bags
                                initialStock[existingIdx] = cur.copy(
                                    availableBags = newBags,
                                    availableLooseKg = (newKg - (newBags * 35.0)).coerceAtLeast(0.0),
                                    totalWeightKg = newKg,
                                    totalMan = newKg / 20.0
                                )
                            } else {
                                initialStock.add(
                                    StockItem(
                                        id = "stk_${System.currentTimeMillis()}",
                                        seedId = item.seedId,
                                        varietyName = item.varietyName,
                                        bagWeightKg = 35.0,
                                        availableBags = item.bags,
                                        totalWeightKg = item.netWeightKg,
                                        totalMan = item.totalMan,
                                        lastPurchaseRate = item.ratePerMan
                                    )
                                )
                            }
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
