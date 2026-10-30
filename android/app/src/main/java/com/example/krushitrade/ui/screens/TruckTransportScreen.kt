package com.example.krushitrade.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.krushitrade.model.*
import com.example.krushitrade.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Data structure representing a single truck trip
data class TruckTripItem(
    val purchaseId: String,
    val billNo: String,
    val date: String,
    val truckNo: String,
    val transporterName: String,
    val partyName: String,
    val varietyName: String,
    val bags: Int,
    val netWeightKg: Double,
    val totalMan: Double,
    val rawPurchase: PurchaseRecord
)

// Data structure representing a truck summary (aggregated across all trips)
data class TruckSummaryGroup(
    val truckNo: String,
    val transporterName: String,
    val tripsCount: Int,
    val totalBags: Int,
    val totalWeightKg: Double,
    val totalMan: Double,
    val latestDate: String,
    val trips: List<TruckTripItem>
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TruckTransportScreen(
    purchases: List<PurchaseRecord>,
    transporters: List<Party> = emptyList(),
    seeds: List<SeedProduct> = emptyList(),
    parties: List<Party> = emptyList(),
    onSavePurchase: (PurchaseRecord) -> Unit,
    onSaveParty: (Party) -> Unit = {}
) {
    val context = LocalContext.current
    var activeTab by remember { mutableStateOf(0) } // 0: Truck-wise summary, 1: All trips list
    var searchQuery by remember { mutableStateOf("") }
    var showAddTripDialog by remember { mutableStateOf(false) }

    // Map all purchases to individual truck trip items
    val allTruckTrips = remember(purchases) {
        val list = mutableListOf<TruckTripItem>()
        for (pur in purchases) {
            val tNo = pur.truckNo.trim()
            val tOwner = pur.truckOwner.trim()

            // Include if either truck number or transporter name is entered, or fallback to record
            val effectiveTruckNo = if (tNo.isNotEmpty()) tNo else if (tOwner.isNotEmpty()) "ટ્રક / વાહન" else ""
            if (effectiveTruckNo.isNotEmpty() || tOwner.isNotEmpty()) {
                val totalBags = pur.items.sumOf { it.bags }
                val totalKg = pur.items.sumOf { it.netWeightKg }
                val totalMan = pur.items.sumOf { it.totalMan }
                val varieties = pur.items.map { it.varietyName }.filter { it.isNotEmpty() }.distinct().joinToString(", ").ifEmpty { "બિયારણ" }

                list.add(
                    TruckTripItem(
                        purchaseId = pur.id,
                        billNo = pur.billNo,
                        date = pur.purchaseDate,
                        truckNo = if (tNo.isNotEmpty()) tNo else "વાહન નં. વિના",
                        transporterName = if (tOwner.isNotEmpty()) tOwner else "ટ્રાન્સપોર્ટર વિના",
                        partyName = pur.partyName.ifEmpty { pur.firmName.ifEmpty { "માલિક / વેપારી" } },
                        varietyName = varieties,
                        bags = totalBags,
                        netWeightKg = totalKg,
                        totalMan = totalMan,
                        rawPurchase = pur
                    )
                )
            }
        }
        list.sortedByDescending { it.date }
    }

    // Group trips by Truck Number and Transporter
    val truckSummaries = remember(allTruckTrips) {
        allTruckTrips
            .groupBy { it.truckNo.uppercase().trim() }
            .map { (trkNo, trips) ->
                val primaryTransporter = trips.firstOrNull { it.transporterName != "ટ્રાન્સપોર્ટર વિના" }?.transporterName
                    ?: trips.firstOrNull()?.transporterName ?: "સામાન્ય ટ્રાન્સપોર્ટ"
                TruckSummaryGroup(
                    truckNo = trkNo,
                    transporterName = primaryTransporter,
                    tripsCount = trips.size,
                    totalBags = trips.sumOf { it.bags },
                    totalWeightKg = trips.sumOf { it.netWeightKg },
                    totalMan = trips.sumOf { it.totalMan },
                    latestDate = trips.maxOfOrNull { it.date } ?: "",
                    trips = trips.sortedByDescending { it.date }
                )
            }
            .sortedByDescending { it.tripsCount }
    }

    // Overall Totals
    val totalUniqueTrucks = truckSummaries.size
    val totalTripsCount = allTruckTrips.size
    val totalBoriCount = allTruckTrips.sumOf { it.bags }
    val totalWeightKgCount = allTruckTrips.sumOf { it.netWeightKg }

    // Filtered lists based on search
    val filteredTruckSummaries = remember(truckSummaries, searchQuery) {
        val q = searchQuery.trim().lowercase()
        if (q.isEmpty()) truckSummaries else {
            truckSummaries.filter {
                it.truckNo.lowercase().contains(q) ||
                it.transporterName.lowercase().contains(q) ||
                it.trips.any { t -> t.partyName.lowercase().contains(q) || t.varietyName.lowercase().contains(q) }
            }
        }
    }

    val filteredTrips = remember(allTruckTrips, searchQuery) {
        val q = searchQuery.trim().lowercase()
        if (q.isEmpty()) allTruckTrips else {
            allTruckTrips.filter {
                it.truckNo.lowercase().contains(q) ||
                it.transporterName.lowercase().contains(q) ||
                it.partyName.lowercase().contains(q) ||
                it.varietyName.lowercase().contains(q) ||
                it.billNo.lowercase().contains(q) ||
                it.date.contains(q)
            }
        }
    }

    // Expanded card tracker for truck summaries
    val expandedTrucks = remember { mutableStateMapOf<String, Boolean>() }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddTripDialog = true },
                containerColor = GreenPrimary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Truck Entry")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BgLight)
                .padding(padding)
                .padding(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🚚 ટ્રક & ટ્રાન્સપોર્ટર ફેરા રજિસ્ટર",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        color = GreenDark
                    )
                    Text(
                        text = "ક્યા ટ્રકમાં કેટલી બોરી આવી, કઈ તારીખે & કુલ ફેરા",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B)
                    )
                }

                Button(
                    onClick = { showAddTripDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("નવો ફેરો", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 4 KPI Summary Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Card 1: Total Trucks
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFEFF6FF),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text("કુલ વાહન/ટ્રક", fontSize = 10.sp, color = Color(0xFF1E40AF), fontWeight = FontWeight.SemiBold)
                        Text("$totalUniqueTrucks", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E3A8A))
                        Text("નોંધાયેલ ટ્રક", fontSize = 9.sp, color = Color(0xFF3B82F6))
                    }
                }

                // Card 2: Total Trips (Fera)
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFF0FDF4),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBBF7D0)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text("કુલ ફેરા (Trips)", fontSize = 10.sp, color = Color(0xFF15803D), fontWeight = FontWeight.SemiBold)
                        Text("$totalTripsCount", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF14532D))
                        Text("આવક ફેરા", fontSize = 9.sp, color = Color(0xFF22C55E))
                    }
                }

                // Card 3: Total Bags (Bori)
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFFEF3C7),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text("આવેલ બોરી", fontSize = 10.sp, color = Color(0xFFB45309), fontWeight = FontWeight.SemiBold)
                        Text("$totalBoriCount", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF78350F))
                        Text("કુલ ગુણી", fontSize = 9.sp, color = Color(0xFFD97706))
                    }
                }

                // Card 4: Total Weight
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFFAF5FF),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE9D5FF)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text("કુલ વજન", fontSize = 10.sp, color = Color(0xFF7E22CE), fontWeight = FontWeight.SemiBold)
                        Text("${(totalWeightKgCount / 20.0).toInt()} મણ", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF581C87))
                        Text("${totalWeightKgCount.toInt()} KG", fontSize = 9.sp, color = Color(0xFFA855F7))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("🔍 ટ્રક નંબર, ટ્રાન્સપોર્ટર કે તારીખ શોધો...", fontSize = 13.sp) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                )
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Tab Selector
            TabRow(
                selectedTabIndex = activeTab,
                containerColor = Color.White,
                contentColor = GreenPrimary
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    text = {
                        Text(
                            "🚛 ટ્રક સમરી (ફેરા & બોરી)",
                            fontSize = 12.sp,
                            fontWeight = if (activeTab == 0) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    text = {
                        Text(
                            "📋 તમામ ફેરા એન્ટ્રી (${allTruckTrips.size})",
                            fontSize = 12.sp,
                            fontWeight = if (activeTab == 1) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Main Content Area
            if (activeTab == 0) {
                // TAB 0: Truck-wise Aggregated View
                if (filteredTruckSummaries.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("કોઈ ટ્રક વિગત ઉપલબ્ધ નથી.", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(filteredTruckSummaries, key = { it.truckNo }) { group ->
                            val isExpanded = expandedTrucks[group.truckNo] ?: false

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                                shape = RoundedCornerShape(12.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    // Header: Truck Number & Fera Badge
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Surface(
                                                shape = RoundedCornerShape(6.dp),
                                                color = Color(0xFFF1F5F9),
                                                modifier = Modifier.padding(end = 8.dp)
                                            ) {
                                                Text(
                                                    text = "🚛 ${group.truckNo}",
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 15.sp,
                                                    color = Color(0xFF0F172A),
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                                )
                                            }
                                        }

                                        // Total Fera Badge
                                        Surface(
                                            shape = RoundedCornerShape(12.dp),
                                            color = Color(0xFFDCFCE7)
                                        ) {
                                            Text(
                                                text = "🔄 કુલ ${group.tripsCount} ફેરા",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = Color(0xFF15803D),
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    // Transporter Name
                                    Text(
                                        text = "🏢 ટ્રાન્સપોર્ટર: ${group.transporterName}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF334155)
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    // Metrics Row: Total Bori & Weight
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = Color(0xFFFEF3C7),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("📦", fontSize = 13.sp)
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Column {
                                                    Text("કુલ બોરી", fontSize = 9.sp, color = Color(0xFF78350F))
                                                    Text("${group.totalBags} બોરી", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF78350F))
                                                }
                                            }
                                        }

                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = Color(0xFFF3E8FF),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("⚖️", fontSize = 13.sp)
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Column {
                                                    Text("કુલ વજન", fontSize = 9.sp, color = Color(0xFF581C87))
                                                    Text("${group.totalMan.toInt()} મણ (${group.totalWeightKg.toInt()} kg)", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF581C87))
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    // Toggle Expand to see all trips
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                expandedTrucks[group.truckNo] = !isExpanded
                                            }
                                            .padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = if (isExpanded) "▲ ફેરા વિગત છુપાવો" else "▼ તમામ ${group.trips.size} ફેરાની તારીખવાર વિગત જુઓ",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = GreenDark
                                        )

                                        if (group.latestDate.isNotEmpty()) {
                                            Text(
                                                text = "છેલ્લો ફેરો: ${group.latestDate}",
                                                fontSize = 10.sp,
                                                color = Color(0xFF64748B)
                                            )
                                        }
                                    }

                                    // Expanded Trips List for this truck
                                    AnimatedVisibility(visible = isExpanded) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(top = 8.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            HorizontalDivider(color = Color(0xFFE2E8F0))
                                            group.trips.forEachIndexed { idx, trip ->
                                                Surface(
                                                    shape = RoundedCornerShape(6.dp),
                                                    color = Color(0xFFF8FAFC),
                                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                                    modifier = Modifier.fillMaxWidth()
                                                ) {
                                                    Row(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .padding(8.dp),
                                                        horizontalArrangement = Arrangement.SpaceBetween,
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        Column(modifier = Modifier.weight(1f)) {
                                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                                Text("ફેરો #${group.trips.size - idx}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GreenPrimary)
                                                                Spacer(modifier = Modifier.width(6.dp))
                                                                Text("📅 ${trip.date}", fontSize = 11.sp, color = Color(0xFF334155))
                                                            }
                                                            Text("🌱 ${trip.varietyName} • ${trip.partyName}", fontSize = 11.sp, color = Color(0xFF475569))
                                                            Text("બિલ નં. ${trip.billNo}", fontSize = 10.sp, color = Color(0xFF94A3B8))
                                                        }

                                                        Column(horizontalAlignment = Alignment.End) {
                                                            Surface(
                                                                shape = RoundedCornerShape(6.dp),
                                                                color = Color(0xFFFEF3C7)
                                                            ) {
                                                                Text(
                                                                    text = "📦 ${trip.bags} બોરી",
                                                                    fontWeight = FontWeight.Bold,
                                                                    fontSize = 12.sp,
                                                                    color = Color(0xFFB45309),
                                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                                )
                                                            }
                                                            Spacer(modifier = Modifier.height(2.dp))
                                                            Text("${trip.totalMan.toInt()} મણ", fontSize = 10.sp, color = Color(0xFF64748B))
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 1: Chronological All Trips List
                if (filteredTrips.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("કોઈ ફેરા એન્ટ્રી મળી નથી.", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredTrips, key = { it.purchaseId }) { trip ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                                shape = RoundedCornerShape(10.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = Color(0xFFDCFCE7),
                                                modifier = Modifier.padding(end = 6.dp)
                                            ) {
                                                Text(
                                                    text = trip.date,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF15803D),
                                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                                )
                                            }
                                            Text(
                                                text = "🚛 ${trip.truckNo}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp,
                                                color = Color(0xFF0F172A)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(3.dp))
                                        Text("🏢 ${trip.transporterName}", fontSize = 12.sp, color = Color(0xFF334155))
                                        Text("👤 માલિક: ${trip.partyName} | 🌱 ${trip.varietyName}", fontSize = 11.sp, color = Color(0xFF64748B))
                                        Text("બિલ: ${trip.billNo}", fontSize = 10.sp, color = Color(0xFF94A3B8))
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = Color(0xFFFEF3C7)
                                        ) {
                                            Text(
                                                text = "📦 ${trip.bags} બોરી",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp,
                                                color = Color(0xFFB45309),
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Text(
                                            text = "${trip.totalMan.toInt()} મણ",
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 12.sp,
                                            color = Color(0xFF475569)
                                        )
                                        Text(
                                            text = "${trip.netWeightKg.toInt()} KG",
                                            fontSize = 10.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialog: Add New Truck Inward Trip Entry ("નવો ટ્રક ફેરો / એન્ટ્રી ઉમેરો")
    if (showAddTripDialog) {
        val todayStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
        var dialogTruckNo by remember { mutableStateOf("") }
        var dialogTransporterName by remember { mutableStateOf("") }
        var dialogMobile by remember { mutableStateOf("") }
        var dialogDate by remember { mutableStateOf(todayStr) }
        var dialogBags by remember { mutableStateOf("") }
        var dialogPartyName by remember { mutableStateOf("") }
        var dialogSelectedSeed by remember { mutableStateOf(seeds.firstOrNull()) }
        var seedDropdownOpen by remember { mutableStateOf(false) }
        var dialogRatePerMan by remember { mutableStateOf("2400") }
        var dialogRemarks by remember { mutableStateOf("") }

        LaunchedEffect(seeds) {
            if (dialogSelectedSeed == null && seeds.isNotEmpty()) {
                dialogSelectedSeed = seeds.firstOrNull()
                dialogRatePerMan = (dialogSelectedSeed?.defaultPurchaseRatePerMan ?: 2400.0).toInt().toString()
            }
        }

        AlertDialog(
            onDismissRequest = { showAddTripDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocalShipping, contentDescription = null, tint = GreenDark)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("નવો ટ્રક ફેરો / એન્ટ્રી ઉમેરો", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = GreenDark)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Truck Number *
                    OutlinedTextField(
                        value = dialogTruckNo,
                        onValueChange = { dialogTruckNo = it.uppercase() },
                        label = { Text("ટ્રક / વાહન નંબર *") },
                        placeholder = { Text("દા.ત. GJ-11-AB-1234") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Transporter Pick / Name
                    if (transporters.isNotEmpty()) {
                        var trkPickerOpen by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = trkPickerOpen,
                            onExpandedChange = { trkPickerOpen = !trkPickerOpen }
                        ) {
                            OutlinedTextField(
                                value = if (dialogTransporterName.isNotEmpty()) dialogTransporterName else "સાચવેલ ટ્રાન્સપોર્ટર લિસ્ટમાંથી પસંદ કરો",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("સાચવેલ ટ્રાન્સપોર્ટર (વૈકલ્પિક)") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = trkPickerOpen) },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = trkPickerOpen,
                                onDismissRequest = { trkPickerOpen = false }
                            ) {
                                transporters.forEach { trk ->
                                    DropdownMenuItem(
                                        text = { Text("${trk.name} ${if (trk.firmName.isNotEmpty()) "(${trk.firmName})" else ""}") },
                                        onClick = {
                                            dialogTransporterName = trk.name
                                            if (trk.firmName.isNotEmpty()) dialogTruckNo = trk.firmName
                                            if (trk.mobile.isNotEmpty()) dialogMobile = trk.mobile
                                            trkPickerOpen = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = dialogTransporterName,
                        onValueChange = { dialogTransporterName = it },
                        label = { Text("ટ્રાન્સપોર્ટર / ટ્રક માલિકનું નામ") },
                        placeholder = { Text("દા.ત. શ્રી ખોડિયાર ટ્રાન્સપોર્ટ") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Mobile
                    OutlinedTextField(
                        value = dialogMobile,
                        onValueChange = { dialogMobile = it },
                        label = { Text("ડ્રાઈવર / ટ્રાન્સપોર્ટર મોબાઈલ") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Date
                    OutlinedTextField(
                        value = dialogDate,
                        onValueChange = { dialogDate = it },
                        label = { Text("આવ્યા તારીખ (YYYY-MM-DD)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Seed Variety Dropdown
                    ExposedDropdownMenuBox(
                        expanded = seedDropdownOpen,
                        onExpandedChange = { seedDropdownOpen = !seedDropdownOpen }
                    ) {
                        OutlinedTextField(
                            value = dialogSelectedSeed?.varietyName ?: "બિયારણ પસંદ કરો",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("બિયારણ જાત (Variety) *") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = seedDropdownOpen) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = seedDropdownOpen,
                            onDismissRequest = { seedDropdownOpen = false }
                        ) {
                            seeds.forEach { s ->
                                DropdownMenuItem(
                                    text = { Text("${s.varietyName} (${s.cropType})") },
                                    onClick = {
                                        dialogSelectedSeed = s
                                        val defRate = s.defaultPurchaseRatePerMan
                                        dialogRatePerMan = if (defRate % 1.0 == 0.0) defRate.toInt().toString() else defRate.toString()
                                        seedDropdownOpen = false
                                    }
                                )
                            }
                        }
                    }

                    // Number of Bags *
                    OutlinedTextField(
                        value = dialogBags,
                        onValueChange = { dialogBags = it },
                        label = { Text("કેટલી બોરી આવી (Bags Count) *") },
                        placeholder = { Text("દા.ત. 400") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Party Name / Goods Owner
                    if (parties.isNotEmpty()) {
                        var ptyPickerOpen by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = ptyPickerOpen,
                            onExpandedChange = { ptyPickerOpen = !ptyPickerOpen }
                        ) {
                            OutlinedTextField(
                                value = if (dialogPartyName.isNotEmpty()) dialogPartyName else "સાચવેલ ખાતેદાર પસંદ કરો",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("સાચવેલ ખાતેદાર / ખેડૂત (વૈકલ્પિક)") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = ptyPickerOpen) },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = ptyPickerOpen,
                                onDismissRequest = { ptyPickerOpen = false }
                            ) {
                                parties.take(40).forEach { pty ->
                                    DropdownMenuItem(
                                        text = { Text("${pty.name} ${if (pty.village.isNotEmpty()) "(${pty.village})" else ""}") },
                                        onClick = {
                                            dialogPartyName = pty.name
                                            ptyPickerOpen = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = dialogPartyName,
                        onValueChange = { dialogPartyName = it },
                        label = { Text("માલિક / ખાતેદારનું નામ (કોનો માલ આવ્યો)") },
                        placeholder = { Text("ખેડૂત / પેઢીનું નામ") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Rate per Man (optional)
                    OutlinedTextField(
                        value = dialogRatePerMan,
                        onValueChange = { dialogRatePerMan = it },
                        label = { Text("ભાવ પ્રતિ મણ (₹/મણ)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Remarks
                    OutlinedTextField(
                        value = dialogRemarks,
                        onValueChange = { dialogRemarks = it },
                        label = { Text("નોંધ / વિગત (વૈકલ્પિક)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val bags = dialogBags.toIntOrNull() ?: 0
                        if (dialogTruckNo.isBlank() && dialogTransporterName.isBlank()) {
                            Toast.makeText(context, "કૃપા કરીને ટ્રક નંબર અથવા ટ્રાન્સપોર્ટર લખો!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (bags <= 0) {
                            Toast.makeText(context, "બોરીની સંખ્યા ૧ કે તેથી વધુ હોવી જોઈએ!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        val curSeed = dialogSelectedSeed ?: seeds.firstOrNull() ?: SeedProduct(varietyName = "GJG-22")
                        val rate = dialogRatePerMan.toDoubleOrNull() ?: curSeed.defaultPurchaseRatePerMan
                        val totalKg = bags * curSeed.bagWeightKg
                        val totalMan = totalKg / MAN_STD_KG
                        val itemTotal = totalMan * rate

                        val item = PurchaseItem(
                            seedId = curSeed.id,
                            varietyName = curSeed.varietyName,
                            bagWeightKg = curSeed.bagWeightKg,
                            bags = bags,
                            lastBagKg = curSeed.bagWeightKg,
                            netWeightKg = totalKg,
                            totalMan = totalMan,
                            ratePerMan = rate,
                            itemTotal = itemTotal
                        )

                        val purchaseBillNo = "SN-TRK-${System.currentTimeMillis().toString().takeLast(6)}"
                        val newPurchase = PurchaseRecord(
                            id = "pur_${System.currentTimeMillis()}",
                            purchaseType = "market",
                            billNo = purchaseBillNo,
                            purchaseDate = dialogDate.ifEmpty { todayStr },
                            partyId = "",
                            partyName = dialogPartyName.trim().ifEmpty { "ટ્રક આવક માલ" },
                            truckNo = dialogTruckNo.trim().uppercase(),
                            truckOwner = dialogTransporterName.trim(),
                            items = listOf(item),
                            itemsSubTotal = itemTotal,
                            netTotal = itemTotal,
                            paidAmount = itemTotal,
                            dueAmount = 0.0,
                            paymentMode = "bank",
                            remarks = "ટ્રક ફેરો: ${dialogRemarks.trim()}",
                            createdBy = "ટ્રક એન્ટ્રી સેક્શન"
                        )

                        onSavePurchase(newPurchase)

                        // Also save transporter party if name is provided
                        if (dialogTransporterName.isNotBlank() || dialogTruckNo.isNotBlank()) {
                            val tName = dialogTransporterName.ifBlank { dialogTruckNo }
                            val newTransporter = Party(
                                id = "party_${System.currentTimeMillis()}",
                                partyType = "transporter",
                                name = tName,
                                firmName = dialogTruckNo.trim().uppercase(),
                                mobile = dialogMobile.trim()
                            )
                            onSaveParty(newTransporter)
                        }

                        showAddTripDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                    enabled = (dialogTruckNo.isNotBlank() || dialogTransporterName.isNotBlank()) && (dialogBags.toIntOrNull() ?: 0) > 0
                ) {
                    Text("સેવ કરો", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTripDialog = false }) {
                    Text("રદ કરો")
                }
            }
        )
    }
}
