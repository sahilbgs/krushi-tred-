package com.example.krushitrade

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.krushitrade.data.KrushiApiRepository
import com.example.krushitrade.model.*
import com.example.krushitrade.ui.screens.*
import com.example.krushitrade.ui.theme.GreenDark
import com.example.krushitrade.ui.theme.GreenPrimary
import com.example.krushitrade.ui.theme.KrushiTradeTheme
import com.example.krushitrade.ui.theme.RedDanger
import kotlinx.coroutines.launch

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "ડેશબોર્ડ", Icons.Default.Dashboard)
    object Sales : Screen("sales", "નવું બિલ", Icons.Default.Receipt)
    object Purchases : Screen("purchases", "ખરીદી", Icons.Default.ShoppingCart)
    object Stock : Screen("stock", "સ્ટોક", Icons.Default.AllInbox)
    object Farmers : Screen("farmers", "ખેડૂત / ખાતું", Icons.Default.People)
}

class MainActivity : ComponentActivity() {
    private lateinit var repository: KrushiApiRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = KrushiApiRepository(applicationContext)

        setContent {
            KrushiTradeTheme {
                MainApp(repository)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp(repository: KrushiApiRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Dashboard) }

    // Live Server Data Lists
    val seedList = remember { mutableStateListOf<SeedProduct>() }
    val partyList = remember { mutableStateListOf<Party>() }
    val stockList = remember { mutableStateListOf<StockItem>() }
    val salesList = remember { mutableStateListOf<SaleInvoice>() }
    val purchasesList = remember { mutableStateListOf<PurchaseRecord>() }

    // Filtered Parties
    val farmersList = remember(partyList.toList()) {
        partyList.filter { it.partyType == "farmer" || it.partyType == "customer" || it.partyType.isEmpty() }
    }
    val firmsList = remember(partyList.toList()) {
        partyList.filter { it.partyType == "firm" || it.partyType == "supplier" }
    }
    val tradersList = remember(partyList.toList()) {
        partyList.filter { it.partyType == "trader" }
    }
    val transportersList = remember(partyList.toList()) {
        partyList.filter { it.partyType == "transporter" }
    }

    var isLoading by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    var savingMessage by remember { mutableStateOf("ડેટા સેવ થઈ રહ્યો છે...") }
    var isOnline by remember { mutableStateOf(true) }
    var lastSyncTime by remember { mutableStateOf("") }
    var showSettingsDialog by remember { mutableStateOf(false) }

    // Function to load data from PostgreSQL server
    fun loadData(showToast: Boolean = false) {
        coroutineScope.launch {
            isLoading = true
            val result = repository.getInitialData()
            isLoading = false
            result.onSuccess { data ->
                isOnline = true
                seedList.clear(); seedList.addAll(data.seeds)
                partyList.clear(); partyList.addAll(data.parties)
                stockList.clear(); stockList.addAll(data.stock)
                salesList.clear(); salesList.addAll(data.sales)
                purchasesList.clear(); purchasesList.addAll(data.purchases)

                val sdf = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.US)
                lastSyncTime = sdf.format(java.util.Date())

                if (showToast) {
                    Toast.makeText(context, "સર્વર સાથે ડેટા સિંક થઈ ગયો ($lastSyncTime)", Toast.LENGTH_SHORT).show()
                }
            }.onFailure { err ->
                isOnline = false
                if (showToast) {
                    Toast.makeText(context, "સર્વર કનેક્શન નિષ્ફળ: ${err.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    // Initial load
    LaunchedEffect(Unit) {
        loadData(showToast = false)
    }

    // Rotation animation for refresh icon
    val infiniteTransition = rememberInfiniteTransition(label = "spin")
    val angle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "spinAngle"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "🌱 કૃષિ ટ્રેડ",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = GreenDark
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            // Status badge
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isOnline) Color(0xFFDCFCE7) else Color(0xFFFEE2E2),
                                modifier = Modifier.clickable { showSettingsDialog = true }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(7.dp)
                                            .background(
                                                if (isOnline) Color(0xFF16A34A) else RedDanger,
                                                CircleShape
                                            )
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        if (isOnline) "લાઈવ સિંક" else "ઑફલાઇન",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isOnline) Color(0xFF15803D) else RedDanger
                                    )
                                }
                            }
                        }
                        Text(
                            if (lastSyncTime.isNotEmpty()) "છેલ્લો સિંક: $lastSyncTime" else "SHREE NANDINI SEEDS",
                            fontSize = 11.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = { loadData(showToast = true) },
                        enabled = !isLoading
                    ) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Sync Data",
                            tint = GreenPrimary,
                            modifier = if (isLoading) Modifier.rotate(angle) else Modifier
                        )
                    }
                    IconButton(onClick = { showSettingsDialog = true }) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = "Server Settings",
                            tint = Color(0xFF475569)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar {
                val screens = listOf(
                    Screen.Dashboard,
                    Screen.Sales,
                    Screen.Purchases,
                    Screen.Stock,
                    Screen.Farmers
                )
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
                    sales = salesList,
                    stock = stockList,
                    onNavigateToSales = { currentScreen = Screen.Sales },
                    onNavigateToStock = { currentScreen = Screen.Stock }
                )
                Screen.Sales -> SalesBillingScreen(
                    farmers = farmersList,
                    stock = stockList,
                    onSaveSale = { newSale ->
                        coroutineScope.launch {
                            isSaving = true
                            savingMessage = "બિલ સેવ થઈ રહ્યું છે અને સ્ટોક અપડેટ થાય છે..."
                            val result = repository.saveSale(newSale)
                            isSaving = false

                            result.onSuccess { saved ->
                                Toast.makeText(
                                    context,
                                    "✅ બિલ નં. ${saved.billNo} સફળતાપૂર્વક સર્વર પર સેવ થયું!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                loadData(showToast = false)
                            }.onFailure { err ->
                                Toast.makeText(
                                    context,
                                    "❌ બિલ સેવ કરવામાં ભૂલ: ${err.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                )
                Screen.Purchases -> PurchaseEntryScreen(
                    farmers = farmersList,
                    firms = firmsList,
                    traders = tradersList,
                    transporters = transportersList,
                    seeds = seedList,
                    recentPurchases = purchasesList,
                    onSavePurchase = { newPur ->
                        coroutineScope.launch {
                            isSaving = true
                            savingMessage = "ખરીદી એન્ટ્રી સેવ થઈ રહી છે અને સ્ટોક વધે છે..."
                            val result = repository.savePurchase(newPur)
                            isSaving = false

                            result.onSuccess { saved ->
                                Toast.makeText(
                                    context,
                                    "✅ ખરીદી બિલ નં. ${saved.billNo} સફળતાપૂર્વક સેવ થઈ ગઈ!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                loadData(showToast = false)
                                currentScreen = Screen.Purchases
                            }.onFailure { err ->
                                Toast.makeText(
                                    context,
                                    "❌ ખરીદી સેવ કરવામાં ભૂલ: ${err.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    },
                    onUpdatePurchase = { updPur ->
                        coroutineScope.launch {
                            isSaving = true
                            savingMessage = "ખરીદી એન્ટ્રી સુધારી રહ્યા છીએ..."
                            val result = repository.updatePurchase(updPur)
                            isSaving = false

                            result.onSuccess { saved ->
                                Toast.makeText(
                                    context,
                                    "✅ ખરીદી બિલ નં. ${saved.billNo} સફળતાપૂર્વક સુધારી લેવાઈ છે!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                loadData(showToast = false)
                            }.onFailure { err ->
                                Toast.makeText(
                                    context,
                                    "❌ ખરીદી સુધારવામાં ભૂલ: ${err.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    },
                    onDeletePurchase = { billNo ->
                        coroutineScope.launch {
                            isSaving = true
                            savingMessage = "ખરીદી એન્ટ્રી રદ/ડીલીટ થઈ રહી છે..."
                            val result = repository.deletePurchase(billNo)
                            isSaving = false

                            result.onSuccess {
                                Toast.makeText(
                                    context,
                                    "🗑️ ખરીદી બિલ નં. $billNo રદ થઈ ગયું!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                loadData(showToast = false)
                            }.onFailure { err ->
                                Toast.makeText(
                                    context,
                                    "❌ ડીલીટ કરવામાં ભૂલ: ${err.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    },
                    onSaveParty = { party ->
                        coroutineScope.launch {
                            isSaving = true
                            savingMessage = "${party.name} અલગ સેવ થઈ રહ્યા છે..."
                            val result = repository.saveParty(party)
                            isSaving = false

                            result.onSuccess { saved ->
                                Toast.makeText(
                                    context,
                                    "✅ ${saved.name} અલગ સેવ થઈ ગયા!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                loadData(showToast = false)
                            }.onFailure { err ->
                                Toast.makeText(
                                    context,
                                    "❌ સેવ કરવામાં ભૂલ: ${err.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                )
                Screen.Stock -> StockLedgerScreen(stock = stockList)
                Screen.Farmers -> FarmerMasterScreen(
                    farmers = farmersList,
                    onAddFarmer = { newFarmer ->
                        coroutineScope.launch {
                            isSaving = true
                            savingMessage = "ખેડૂત સર્વર પર ઉમેરાઈ રહ્યો છે..."
                            val result = repository.saveParty(newFarmer)
                            isSaving = false

                            result.onSuccess { saved ->
                                Toast.makeText(
                                    context,
                                    "✅ ${saved.name} સફળતાપૂર્વક સર્વર પર ઉમેરાઈ ગયા!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                loadData(showToast = false)
                            }.onFailure { err ->
                                Toast.makeText(
                                    context,
                                    "❌ ખેડૂત ઉમેરવામાં ભૂલ: ${err.message}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                )
            }
        }
    }

    // Saving Scrim Overlay Dialog
    if (isSaving) {
        Dialog(onDismissRequest = {}) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                tonalElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.padding(24.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        color = GreenPrimary,
                        modifier = Modifier.size(36.dp),
                        strokeWidth = 3.dp
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        savingMessage,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF1E293B)
                    )
                }
            }
        }
    }

    // Server Settings Dialog
    if (showSettingsDialog) {
        var urlInput by remember { mutableStateOf(repository.getBaseUrl()) }
        AlertDialog(
            onDismissRequest = { showSettingsDialog = false },
            title = {
                Text(
                    "સર્વર સેટિંગ્સ (Server Settings)",
                    fontWeight = FontWeight.Bold,
                    color = GreenDark
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "મુખ્ય ડેટાબેઝ સર્વર URL (વેબ અને APK વચ્ચે ડેટા આપ-લે માટે):",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                    OutlinedTextField(
                        value = urlInput,
                        onValueChange = { urlInput = it },
                        label = { Text("Server API URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                    Text(
                        "ડિફૉલ્ટ ક્લાઉડ લિંક: https://krushi.aceglory.in",
                        fontSize = 11.sp,
                        color = GreenPrimary
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (urlInput.isNotBlank()) {
                            repository.setBaseUrl(urlInput.trim())
                            showSettingsDialog = false
                            loadData(showToast = true)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                ) {
                    Text("સેવ કરો & સિંક કરો")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSettingsDialog = false }) {
                    Text("બંધ કરો")
                }
            }
        )
    }
}
