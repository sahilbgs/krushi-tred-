package com.example.krushitrade.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import com.example.krushitrade.util.InvoicePdfHelper
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PurchaseEntryScreen(
    farmers: List<Party>,
    firms: List<Party>,
    traders: List<Party>,
    transporters: List<Party> = emptyList(),
    seeds: List<SeedProduct>,
    recentPurchases: List<PurchaseRecord> = emptyList(),
    onSavePurchase: (PurchaseRecord) -> Unit,
    onUpdatePurchase: (PurchaseRecord) -> Unit = {},
    onDeletePurchase: (String) -> Unit = {},
    onSaveParty: (Party) -> Unit = {}
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    // Edit Mode State
    var editingPurchase by remember { mutableStateOf<PurchaseRecord?>(null) }

    // Purchase Mode: "farmer" (ખેડૂત પાસેથી) or "market" (માર્કેટ પેઢી પાસેથી)
    var purchaseType by remember { mutableStateOf("farmer") }

    // Common fields
    val todayDateStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
    var billNo by remember { mutableStateOf("SN-PUR-${System.currentTimeMillis().toString().takeLast(6)}") }
    var purchaseDate by remember { mutableStateOf(todayDateStr) }
    var paymentMode by remember { mutableStateOf("bank") }
    var paidInput by remember { mutableStateOf("") }
    var remarksInput by remember { mutableStateOf("") }

    // Mode 1: Farmer
    var selectedFarmer by remember { mutableStateOf<Party?>(farmers.firstOrNull()) }
    var farmerDropdownExpanded by remember { mutableStateOf(false) }
    var farmerNameInput by remember { mutableStateOf(selectedFarmer?.name ?: "") }
    var farmerVillage by remember { mutableStateOf(selectedFarmer?.village ?: "") }
    var farmerMobile by remember { mutableStateOf(selectedFarmer?.mobile ?: "") }
    var majuriPerBagInput by remember { mutableStateOf("10") }

    // Mode 2: Market
    var selectedFirm by remember { mutableStateOf<Party?>(firms.firstOrNull()) }
    var firmDropdownExpanded by remember { mutableStateOf(false) }
    val filteredTraders = remember(selectedFirm, traders) {
        traders.filter { selectedFirm == null || it.firmId == selectedFirm?.id }
    }
    var selectedTrader by remember { mutableStateOf<Party?>(filteredTraders.firstOrNull()) }
    var traderDropdownExpanded by remember { mutableStateOf(false) }
    var marketCommissionInput by remember { mutableStateOf("0") }
    var firmCommissionInput by remember { mutableStateOf("0") }
    var bardanExpenseInput by remember { mutableStateOf("0") }
    var marketMajuriInput by remember { mutableStateOf("0") }

    // Truck / Transporter Details (Available in BOTH Farmer and Market purchases)
    var selectedTransporter by remember { mutableStateOf<Party?>(null) }
    var transporterDropdownExpanded by remember { mutableStateOf(false) }
    var truckNoInput by remember { mutableStateOf("") }
    var truckOwnerInput by remember { mutableStateOf("") }
    var truckMobileInput by remember { mutableStateOf("") }

    // Item adding state - 2 Groups (બોરી × કિલો અને ફરી બોરી × કિલો)
    var selectedSeed by remember { mutableStateOf<SeedProduct?>(seeds.firstOrNull()) }
    var seedDropdownExpanded by remember { mutableStateOf(false) }
    var bags1Input by remember { mutableStateOf("20") }
    var kg1Input by remember { mutableStateOf("35") }
    var bags2Input by remember { mutableStateOf("0") }
    var kg2Input by remember { mutableStateOf("0") }
    var ratePerManInput by remember { mutableStateOf("2400") }

    // Items List
    val itemsList = remember { mutableStateListOf<PurchaseItem>() }

    // Confirmation, Delete Dialogs & Print state
    var showConfirmDialog by remember { mutableStateOf(false) }
    var purchaseToDelete by remember { mutableStateOf<PurchaseRecord?>(null) }
    var savedPurchaseForPrint by remember { mutableStateOf<PurchaseRecord?>(null) }

    // Update defaults when master lists load
    LaunchedEffect(farmers) {
        if (selectedFarmer == null && farmers.isNotEmpty() && editingPurchase == null) {
            val f = farmers.firstOrNull()
            selectedFarmer = f
            farmerNameInput = f?.name ?: ""
            farmerVillage = f?.village ?: ""
            farmerMobile = f?.mobile ?: ""
        }
    }
    LaunchedEffect(firms) {
        if (selectedFirm == null && firms.isNotEmpty() && editingPurchase == null) {
            selectedFirm = firms.firstOrNull()
        }
    }
    LaunchedEffect(filteredTraders) {
        if (selectedTrader == null && filteredTraders.isNotEmpty() && editingPurchase == null) {
            selectedTrader = filteredTraders.firstOrNull()
        }
    }
    LaunchedEffect(seeds) {
        if (selectedSeed == null && seeds.isNotEmpty() && editingPurchase == null) {
            selectedSeed = seeds.firstOrNull()
            val defRate = selectedSeed?.defaultPurchaseRatePerMan ?: 2400.0
            ratePerManInput = if (defRate % 1.0 == 0.0) defRate.toInt().toString() else defRate.toString()
            val defKg = selectedSeed?.bagWeightKg ?: 35.0
            kg1Input = if (defKg % 1.0 == 0.0) defKg.toInt().toString() else defKg.toString()
            bags2Input = "0"
            kg2Input = "0"
        }
    }

    // Helper to format currency/numbers
    fun fmt(num: Double): String {
        return if (num % 1.0 == 0.0) {
            num.toInt().toString()
        } else {
            String.format(Locale.US, "%.2f", num)
        }
    }

    // Calculations for currently typed item: (bags1 * kg1) + (bags2 * kg2)
    val curB1 = bags1Input.toIntOrNull() ?: 0
    val curK1 = kg1Input.toDoubleOrNull() ?: 0.0
    val curB2 = bags2Input.toIntOrNull() ?: 0
    val curK2 = kg2Input.toDoubleOrNull() ?: 0.0

    val curBags = curB1 + curB2
    val curTotalKg = (curB1 * curK1) + (curB2 * curK2)
    val curTotalMan = curTotalKg / MAN_STD_KG
    val curRate = ratePerManInput.toDoubleOrNull() ?: 0.0
    val curItemTotal = curTotalMan * curRate

    // Totals across added items
    val totalBagsCount = itemsList.sumOf { it.bags }
    val totalWeightKg = itemsList.sumOf { it.netWeightKg }
    val totalManCount = itemsList.sumOf { it.totalMan }
    val itemsSubTotal = itemsList.sumOf { it.itemTotal }

    val calculatedExpenses: Double = if (purchaseType == "farmer") {
        val majuriRate = majuriPerBagInput.toDoubleOrNull() ?: 0.0
        totalBagsCount * majuriRate
    } else {
        (marketCommissionInput.toDoubleOrNull() ?: 0.0) +
        (firmCommissionInput.toDoubleOrNull() ?: 0.0) +
        (bardanExpenseInput.toDoubleOrNull() ?: 0.0) +
        (marketMajuriInput.toDoubleOrNull() ?: 0.0)
    }

    val netTotal = if (purchaseType == "farmer") {
        (itemsSubTotal - calculatedExpenses).coerceAtLeast(0.0)
    } else {
        itemsSubTotal + calculatedExpenses
    }
    val paidAmount = if (paidInput.isEmpty()) netTotal else (paidInput.toDoubleOrNull() ?: 0.0)
    val dueAmount = (netTotal - paidAmount).coerceAtLeast(0.0)

    // Reset Form
    fun resetForm() {
        editingPurchase = null
        billNo = "SN-PUR-${System.currentTimeMillis().toString().takeLast(6)}"
        purchaseDate = todayDateStr
        itemsList.clear()
        bags1Input = "20"
        kg1Input = "35"
        bags2Input = "0"
        kg2Input = "0"
        ratePerManInput = "2400"
        paidInput = ""
        remarksInput = ""
        truckNoInput = ""
        truckOwnerInput = ""
        truckMobileInput = ""
        selectedTransporter = null
        majuriPerBagInput = "10"
        marketCommissionInput = "0"
        firmCommissionInput = "0"
        bardanExpenseInput = "0"
        marketMajuriInput = "0"
        val f = farmers.firstOrNull()
        selectedFarmer = f
        farmerNameInput = f?.name ?: ""
        farmerVillage = f?.village ?: ""
        farmerMobile = f?.mobile ?: ""
    }

    // Populate form for Edit
    fun startEdit(pur: PurchaseRecord) {
        editingPurchase = pur
        purchaseType = if (pur.purchaseType == "market" || pur.purchaseType == "firm") "market" else "farmer"
        billNo = pur.billNo
        purchaseDate = pur.purchaseDate
        paymentMode = pur.paymentMode
        paidInput = if (pur.paidAmount > 0) fmt(pur.paidAmount) else ""
        remarksInput = pur.remarks
        truckNoInput = pur.truckNo
        truckOwnerInput = pur.truckOwner

        if (purchaseType == "farmer") {
            selectedFarmer = farmers.find { it.id == pur.partyId } ?: Party(
                id = pur.partyId,
                name = pur.partyName,
                village = pur.village,
                mobile = pur.mobile
            )
            farmerNameInput = pur.partyName
            farmerVillage = pur.village
            farmerMobile = pur.mobile
            majuriPerBagInput = if (pur.majuriRatePerBag > 0) fmt(pur.majuriRatePerBag) else "10"
        } else {
            selectedFirm = firms.find { it.id == pur.firmId } ?: Party(id = pur.firmId, name = pur.firmName)
            selectedTrader = traders.find { it.id == pur.traderId } ?: Party(id = pur.traderId, name = pur.traderName)
            marketCommissionInput = fmt(pur.marketCommission)
            firmCommissionInput = fmt(pur.firmCommission)
            bardanExpenseInput = fmt(pur.bardanExpense)
            marketMajuriInput = fmt(pur.majuriAmount)
        }

        itemsList.clear()
        itemsList.addAll(pur.items)

        Toast.makeText(context, "✏️ બિલ ${pur.billNo} સુધારવા માટે લોડ થઈ ગયું છે.", Toast.LENGTH_SHORT).show()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgLight)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // Header
        Text(
            text = "SHREE NANDINI SEEDS",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = GreenDark
        )
        Text(
            text = if (editingPurchase != null) "ખરીદી એન્ટ્રી સુધારો (Edit Purchase)" else "નવી બિયારણ ખરીદી (બોરી × કિલો ગણતરી, ૧ મણ = ૨૦ KG)",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Edit Mode Banner
        if (editingPurchase != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "✏️ એડિટ મોડ: બિલ નં. ${editingPurchase!!.billNo}",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFB45309),
                            fontSize = 14.sp
                        )
                        Text(
                            text = "આ બિલમાં ફેરફાર કરી નીચે 'ખરીદી સુધારો સેવ કરો' દબાવો.",
                            fontSize = 11.sp,
                            color = Color(0xFF78350F)
                        )
                    }
                    Button(
                        onClick = { resetForm() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("રદ કરો (Cancel)", fontSize = 11.sp)
                    }
                }
            }
        }

        // Purchase Mode Switcher
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { purchaseType = "farmer" },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (purchaseType == "farmer") GreenPrimary else Color(0xFFE2E8F0),
                    contentColor = if (purchaseType == "farmer") Color.White else Color(0xFF334155)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("ખેડૂત ખરીદી", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { purchaseType = "market" },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (purchaseType == "market") GreenPrimary else Color(0xFFE2E8F0),
                    contentColor = if (purchaseType == "market") Color.White else Color(0xFF334155)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("માર્કેટ પેઢી ખરીદી", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Section 1: Malik / Party Details
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (purchaseType == "farmer") "૧. માલિક / ખેડૂત વિગત" else "૧. માલિક / પેઢી & વેપારી વિગત",
                        fontWeight = FontWeight.Bold,
                        color = GreenDark
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))

                if (purchaseType == "farmer") {
                    // Farmer Dropdown
                    ExposedDropdownMenuBox(
                        expanded = farmerDropdownExpanded,
                        onExpandedChange = { farmerDropdownExpanded = !farmerDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = farmerNameInput.ifEmpty { "ખેડૂત પસંદ કરો / લખો" },
                            onValueChange = {
                                farmerNameInput = it
                            },
                            label = { Text("માલિક / ખેડૂતનું નામ") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = farmerDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = farmerDropdownExpanded,
                            onDismissRequest = { farmerDropdownExpanded = false }
                        ) {
                            farmers.forEach { f ->
                                DropdownMenuItem(
                                    text = { Text("${f.name} (${f.village})") },
                                    onClick = {
                                        selectedFarmer = f
                                        farmerNameInput = f.name
                                        farmerVillage = f.village
                                        farmerMobile = f.mobile
                                        farmerDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = farmerVillage,
                            onValueChange = { farmerVillage = it },
                            label = { Text("ગામ") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        OutlinedTextField(
                            value = farmerMobile,
                            onValueChange = { farmerMobile = it },
                            label = { Text("મોબાઈલ નં") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    // Separate Malik Save Button
                    OutlinedButton(
                        onClick = {
                            if (farmerNameInput.isBlank()) {
                                Toast.makeText(context, "ખેડૂતનું નામ દાખલ કરો!", Toast.LENGTH_SHORT).show()
                                return@OutlinedButton
                            }
                            val existing = farmers.find { it.name.trim() == farmerNameInput.trim() }
                            val party = existing?.copy(
                                village = farmerVillage,
                                mobile = farmerMobile
                            ) ?: Party(
                                id = "party_${System.currentTimeMillis()}",
                                partyType = "farmer",
                                name = farmerNameInput.trim(),
                                village = farmerVillage.trim(),
                                mobile = farmerMobile.trim()
                            )
                            onSaveParty(party)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = GreenDark)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("💾 આ માલિક વિગત અલગ સેવ કરો (ખેડૂત લિસ્ટમાં)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
                    // Market Firm & Trader Dropdown
                    ExposedDropdownMenuBox(
                        expanded = firmDropdownExpanded,
                        onExpandedChange = { firmDropdownExpanded = !firmDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedFirm?.name ?: "માર્કેટ પેઢી પસંદ કરો",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("પેઢીનું નામ (Firm)") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = firmDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = firmDropdownExpanded,
                            onDismissRequest = { firmDropdownExpanded = false }
                        ) {
                            firms.forEach { f ->
                                DropdownMenuItem(
                                    text = { Text(f.name) },
                                    onClick = {
                                        selectedFirm = f
                                        firmDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Trader Dropdown
                    ExposedDropdownMenuBox(
                        expanded = traderDropdownExpanded,
                        onExpandedChange = { traderDropdownExpanded = !traderDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedTrader?.name ?: "વેપારી પસંદ કરો",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("વેપારી (Trader)") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = traderDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = traderDropdownExpanded,
                            onDismissRequest = { traderDropdownExpanded = false }
                        ) {
                            filteredTraders.forEach { t ->
                                DropdownMenuItem(
                                    text = { Text(t.name) },
                                    onClick = {
                                        selectedTrader = t
                                        traderDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = {
                            val party = selectedTrader ?: selectedFirm
                            if (party != null) {
                                onSaveParty(party)
                            } else {
                                Toast.makeText(context, "પેઢી અથવા વેપારી પસંદ કરો!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = GreenDark)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("💾 આ પેઢી/વેપારી અલગ સેવ કરો", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Section 2: Truck / Transporter Details (Available for BOTH modes)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.LocalShipping, contentDescription = null, tint = GreenDark, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("૨. ટ્રક અને ટ્રાન્સપોર્ટર વિગત (અલગ સેવ ઉપલબ્ધ)", fontWeight = FontWeight.Bold, color = GreenDark)
                }
                Spacer(modifier = Modifier.height(8.dp))

                // Transporter Dropdown
                if (transporters.isNotEmpty()) {
                    ExposedDropdownMenuBox(
                        expanded = transporterDropdownExpanded,
                        onExpandedChange = { transporterDropdownExpanded = !transporterDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedTransporter?.name ?: (if (truckOwnerInput.isNotEmpty()) truckOwnerInput else "ટ્રાન્સપોર્ટર પસંદ કરો (વૈકલ્પિક)"),
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("સાચવેલ ટ્રાન્સપોર્ટર લિસ્ટ") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = transporterDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = transporterDropdownExpanded,
                            onDismissRequest = { transporterDropdownExpanded = false }
                        ) {
                            transporters.forEach { t ->
                                DropdownMenuItem(
                                    text = { Text("${t.name} ${if (t.firmName.isNotEmpty()) "(${t.firmName})" else ""}") },
                                    onClick = {
                                        selectedTransporter = t
                                        truckOwnerInput = t.name
                                        if (t.firmName.isNotEmpty()) truckNoInput = t.firmName
                                        if (t.mobile.isNotEmpty()) truckMobileInput = t.mobile
                                        transporterDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = truckNoInput,
                        onValueChange = { truckNoInput = it.uppercase() },
                        label = { Text("ટ્રક નંબર") },
                        placeholder = { Text("GJ-01-AB-1234") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    OutlinedTextField(
                        value = truckOwnerInput,
                        onValueChange = { truckOwnerInput = it },
                        label = { Text("ટ્રક માલિક / ટ્રાન્સપોર્ટર") },
                        placeholder = { Text("દા.ત. પટેલ ટ્રાન્સપોર્ટ") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = truckMobileInput,
                    onValueChange = { truckMobileInput = it },
                    label = { Text("ટ્રક ડ્રાઈવર / માલિક મોબાઈલ નં") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))
                // Automatic Truck Sync Banner
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (truckNoInput.isNotBlank()) Color(0xFFDCFCE7) else Color(0xFFF1F5F9),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (truckNoInput.isNotBlank()) Color(0xFF86EFAC) else Color(0xFFCBD5E1)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        if (truckNoInput.isNotBlank()) {
                            Text(
                                text = "⚡ ઓટો-લિંક: ટ્રક $truckNoInput માં $totalBagsCount બોરી (${fmt(totalWeightKg)} KG માલ) આપોઆપ ટ્રક રજિસ્ટરમાં એડ થઈ જશે (અલગથી સેવ કરવાની જરૂર નથી).",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF14532D)
                            )
                        } else {
                            Text(
                                text = "💡 જો વાહન ન હોય તો આ ખાનું ખાલી રાખો — માત્ર ખરીદી જ સેવ થશે, કોઈ ગાડી એડ નહીં થાય.",
                                fontSize = 11.sp,
                                color = Color(0xFF475569)
                            )
                        }
                    }
                }
            }
        }

        // Section 3: Seed Variety, Bags x KG Input (Group 1 + Group 2)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૩. બિયારણ જાત, બોરી × કિલો અને ભાવ", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                // Variety
                ExposedDropdownMenuBox(
                    expanded = seedDropdownExpanded,
                    onExpandedChange = { seedDropdownExpanded = !seedDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedSeed?.varietyName ?: "બિયારણ પસંદ કરો",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("બિયારણ જાત") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = seedDropdownExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = seedDropdownExpanded,
                        onDismissRequest = { seedDropdownExpanded = false }
                    ) {
                        seeds.forEach { s ->
                            DropdownMenuItem(
                                text = { Text(s.varietyName) },
                                onClick = {
                                    selectedSeed = s
                                    val defRate = s.defaultPurchaseRatePerMan
                                    ratePerManInput = if (defRate % 1.0 == 0.0) defRate.toInt().toString() else defRate.toString()
                                    val defBagKg = s.bagWeightKg
                                    kg1Input = if (defBagKg % 1.0 == 0.0) defBagKg.toInt().toString() else defBagKg.toString()
                                    bags2Input = "0"
                                    kg2Input = "0"
                                    seedDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Group 1: Bags 1 x KG 1
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFF8FAFC),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("૧. બોરી (બેગ) × કિલો", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = GreenDark)
                            Text("સબ-ટોટલ: ${fmt(curB1 * curK1)} KG", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = bags1Input,
                                onValueChange = { bags1Input = it },
                                label = { Text("બોરી ૧ (બેગ)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            )
                            OutlinedTextField(
                                value = kg1Input,
                                onValueChange = { kg1Input = it },
                                label = { Text("વજન પ્રતિ બેગ (KG)") },
                                placeholder = { Text("35") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Group 2: Bags 2 x KG 2
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFFFBEB),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("૨. ફરી બોરી × કિલો (વધારાની / અલગ વજન)", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFFB45309))
                            Text("સબ-ટોટલ: ${fmt(curB2 * curK2)} KG", fontSize = 11.sp, color = Color(0xFF92400E), fontWeight = FontWeight.SemiBold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = bags2Input,
                                onValueChange = { bags2Input = it },
                                label = { Text("ફરી બોરી ૨ (બેગ)") },
                                placeholder = { Text("0") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            )
                            OutlinedTextField(
                                value = kg2Input,
                                onValueChange = { kg2Input = it },
                                label = { Text("વજન ૨ (KG)") },
                                placeholder = { Text("0") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Rate per man
                    OutlinedTextField(
                        value = ratePerManInput,
                        onValueChange = { ratePerManInput = it },
                        label = { Text("ભાવ (₹/મણ - ૨૦ KG)") },
                        placeholder = { Text("2400") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )

                    // Auto weight pill
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp))
                            .padding(8.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text("કુલ બોરી: $curBags | KG: ${fmt(curTotalKg)}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text("કુલ મણ: ${fmt(curTotalMan)} મણ", fontSize = 12.sp, color = GreenPrimary, fontWeight = FontWeight.Bold)
                        Text("રકમ: ₹${fmt(curItemTotal)}", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = {
                        if (curBags <= 0 || curTotalKg <= 0.0 || selectedSeed == null) {
                            Toast.makeText(context, "યોગ્ય બોરી અને વજન વિગત દાખલ કરો", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        itemsList.add(
                            PurchaseItem(
                                seedId = selectedSeed!!.id,
                                varietyName = selectedSeed!!.varietyName,
                                bags1 = curB1,
                                kg1 = curK1,
                                bags2 = curB2,
                                kg2 = curK2,
                                bags = curBags,
                                lastBagKg = curK1,
                                netWeightKg = curTotalKg,
                                totalMan = curTotalMan,
                                ratePerMan = curRate,
                                purchaseRate = curRate,
                                itemTotal = curItemTotal
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("+ બિલમાં ઉમેરો (Add Item)")
                }
            }
        }

        // Section 4: Added Items List
        if (itemsList.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("ઉમેરેલ જાતો (${itemsList.size})", fontWeight = FontWeight.Bold, color = GreenDark)
                    Spacer(modifier = Modifier.height(6.dp))

                    itemsList.forEachIndexed { idx, it ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(it.varietyName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                val breakdown = if (it.bags2 > 0) "${it.bags1}×${fmt(it.kg1)}kg + ${it.bags2}×${fmt(it.kg2)}kg" else "${it.bags1}×${fmt(it.kg1)}kg"
                                Text("${it.bags} બોરી ($breakdown) | ${fmt(it.netWeightKg)} KG (${fmt(it.totalMan)} મણ) @ ₹${fmt(it.ratePerMan)}", fontSize = 11.sp, color = Color(0xFF64748B))
                            }
                            Text("₹${fmt(it.itemTotal)}", fontWeight = FontWeight.Bold, color = GreenPrimary)
                            IconButton(onClick = { itemsList.removeAt(idx) }) {
                                Icon(Icons.Default.Delete, contentDescription = null, tint = Color.Red)
                            }
                        }
                        Divider(color = Color(0xFFF1F5F9))
                    }
                }
            }
        }

        // Section 5: Expenses & Net Total (With Decimal Support)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૪. ખર્ચ અને Net Total", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                if (purchaseType == "farmer") {
                    OutlinedTextField(
                        value = majuriPerBagInput,
                        onValueChange = { majuriPerBagInput = it },
                        label = { Text("મજૂરી પ્રતિ બેગ (₹/બેગ)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                } else {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = marketCommissionInput,
                            onValueChange = { marketCommissionInput = it },
                            label = { Text("માર્કેટ કમિશન ₹") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        OutlinedTextField(
                            value = firmCommissionInput,
                            onValueChange = { firmCommissionInput = it },
                            label = { Text("પેઢી કમિશન ₹") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = bardanExpenseInput,
                            onValueChange = { bardanExpenseInput = it },
                            label = { Text("બારદાન ₹") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        OutlinedTextField(
                            value = marketMajuriInput,
                            onValueChange = { marketMajuriInput = it },
                            label = { Text("મજૂરી ₹") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                if (purchaseType == "farmer" && calculatedExpenses > 0) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("બાદ: મજૂરી:", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFDC2626))
                        Text("- ₹${fmt(calculatedExpenses)}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFDC2626))
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Net Total (ચુકવવાપાત્ર):", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = GreenDark)
                    Text("₹${fmt(netTotal)}", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = GreenDark)
                }

                Spacer(modifier = Modifier.height(6.dp))
                OutlinedTextField(
                    value = paidInput,
                    onValueChange = { paidInput = it },
                    label = { Text("ચૂકવેલ રકમ (Paid)") },
                    placeholder = { Text("દા.ત. ${fmt(netTotal)}") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                if (dueAmount > 0) {
                    Text(
                        text = "બાકી રકમ (Due): ₹${fmt(dueAmount)}",
                        color = Color(0xFFEA580C),
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Save / Update Button
        Button(
            onClick = {
                if (itemsList.isEmpty()) {
                    Toast.makeText(context, "ઓછામાં ઓછી ૧ જાત ઉમેરો!", Toast.LENGTH_SHORT).show()
                    return@Button
                }
                showConfirmDialog = true
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (editingPurchase != null) Color(0xFFD97706) else GreenDark
            ),
            shape = RoundedCornerShape(10.dp)
        ) {
            Icon(if (editingPurchase != null) Icons.Default.Edit else Icons.Default.Check, contentDescription = null)
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = if (editingPurchase != null) "💾 ખરીદી સુધારો સેવ કરો (Update Purchase)" else "ખરીદી સેવ કરો (Confirm Purchase)",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Section 7: Recent Purchases Register (With Edit & Delete options)
        if (recentPurchases.isNotEmpty()) {
            Text(
                text = "📋 તાજેતરની ખરીદીઓ (Recent Purchases - ${recentPurchases.size})",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF0F172A),
                modifier = Modifier.padding(bottom = 10.dp)
            )

            recentPurchases.take(15).forEach { pur ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(10.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(pur.billNo, fontWeight = FontWeight.Bold, color = GreenDark, fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = if (pur.purchaseType == "market" || pur.purchaseType == "firm") Color(0xFFEFF6FF) else Color(0xFFDCFCE7)
                                ) {
                                    Text(
                                        text = if (pur.purchaseType == "market" || pur.purchaseType == "firm") "માર્કેટ" else "ખેડૂત",
                                        fontSize = 10.sp,
                                        color = if (pur.purchaseType == "market" || pur.purchaseType == "firm") Color(0xFF2563EB) else Color(0xFF16A34A),
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Text(pur.purchaseDate, fontSize = 11.sp, color = Color(0xFF64748B))
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "માલિક: ${pur.partyName} ${if (pur.village.isNotEmpty()) "(${pur.village})" else ""}",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )

                        if (pur.truckNo.isNotEmpty() || pur.truckOwner.isNotEmpty()) {
                            Text(
                                text = "🚚 ટ્રક: ${pur.truckNo} ${if (pur.truckOwner.isNotEmpty()) "(${pur.truckOwner})" else ""}",
                                fontSize = 11.sp,
                                color = Color(0xFF475569)
                            )
                        }

                        val purBags = pur.items.sumOf { it.bags }
                        val purKg = pur.items.sumOf { it.netWeightKg }
                        Text(
                            text = "કુલ: $purBags બેગ | ${fmt(purKg)} kg | Net: ₹${fmt(pur.netTotal)}",
                            fontSize = 12.sp,
                            color = Color(0xFF334155),
                            fontWeight = FontWeight.Medium
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = { sharePurchaseVoucher(context, pur) },
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = GreenDark)
                            ) {
                                Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("🖨️ પ્રિન્ટ", fontSize = 11.sp)
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            OutlinedButton(
                                onClick = { startEdit(pur) },
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF2563EB))
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("✏️ એડિટ", fontSize = 11.sp)
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            OutlinedButton(
                                onClick = { purchaseToDelete = pur },
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626))
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("🗑️ ડીલીટ", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    // Confirmation Dialog
    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = {
                Text(if (editingPurchase != null) "ખરીદી સુધારો ખાતરી કરો" else "ખરીદી ખાતરી કરો")
            },
            text = {
                Column {
                    Text("બિલ નં: $billNo")
                    Text("કુલ બેગ: $totalBagsCount")
                    Text("કુલ વજન: ${fmt(totalWeightKg)} KG (${fmt(totalManCount)} મણ)")
                    Text("Net Total: ₹${fmt(netTotal)}")
                    Text("ચૂકવેલ: ₹${fmt(paidAmount)} | બાકી: ₹${fmt(dueAmount)}")
                    if (truckNoInput.isNotEmpty()) {
                        Text("ટ્રક નંબર: $truckNoInput")
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val party = if (purchaseType == "farmer") {
                            selectedFarmer ?: Party(
                                id = "party_${System.currentTimeMillis()}",
                                name = farmerNameInput,
                                village = farmerVillage,
                                mobile = farmerMobile
                            )
                        } else {
                            (selectedTrader ?: selectedFirm)
                        }

                        val majuriRate = if (purchaseType == "farmer") majuriPerBagInput.toDoubleOrNull() ?: 10.0 else 0.0

                        val record = PurchaseRecord(
                            id = editingPurchase?.id ?: "pur_${System.currentTimeMillis()}",
                            purchaseType = purchaseType,
                            billNo = billNo,
                            purchaseDate = purchaseDate,
                            partyId = party?.id ?: "",
                            partyName = party?.name ?: (if (purchaseType == "farmer") farmerNameInput else "અજ્ઞાત"),
                            village = if (purchaseType == "farmer") farmerVillage else (selectedFirm?.village ?: ""),
                            mobile = if (purchaseType == "farmer") farmerMobile else (party?.mobile ?: ""),
                            firmId = selectedFirm?.id ?: "",
                            firmName = selectedFirm?.name ?: "",
                            traderId = selectedTrader?.id ?: "",
                            truckNo = truckNoInput.trim().uppercase(),
                            truckOwner = truckOwnerInput.trim(),
                            items = itemsList.toList(),
                            itemsSubTotal = itemsSubTotal,
                            majuriRatePerBag = majuriRate,
                            majuriAmount = calculatedExpenses,
                            marketCommission = marketCommissionInput.toDoubleOrNull() ?: 0.0,
                            firmCommission = firmCommissionInput.toDoubleOrNull() ?: 0.0,
                            bardanExpense = bardanExpenseInput.toDoubleOrNull() ?: 0.0,
                            totalExpenses = calculatedExpenses,
                            netTotal = netTotal,
                            paidAmount = paidAmount,
                            dueAmount = dueAmount,
                            paymentMode = paymentMode,
                            remarks = remarksInput,
                            createdBy = editingPurchase?.createdBy ?: "Ravi Chaudhary (Main Admin)"
                        )

                        val cleanTrk = truckNoInput.trim().uppercase()
                        val cleanOwner = truckOwnerInput.trim()
                        if (cleanTrk.isNotBlank() || cleanOwner.isNotBlank()) {
                            val tName = cleanOwner.ifBlank { cleanTrk }
                            val newTransporter = Party(
                                id = "party_${System.currentTimeMillis()}",
                                partyType = "transporter",
                                name = tName,
                                firmName = cleanTrk,
                                mobile = truckMobileInput.trim()
                            )
                            onSaveParty(newTransporter)
                        }

                        if (editingPurchase != null) {
                            onUpdatePurchase(record)
                            savedPurchaseForPrint = record
                            if (cleanTrk.isNotBlank() || cleanOwner.isNotBlank()) {
                                Toast.makeText(context, "✅ ખરીદી સુધારી & ટ્રક $cleanTrk માં $totalBagsCount બોરી અપડેટ થઈ!", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "✅ ખરીદી બિલ સુધારાઈ ગયું (વાહન વિના).", Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            onSavePurchase(record)
                            savedPurchaseForPrint = record
                            if (cleanTrk.isNotBlank() || cleanOwner.isNotBlank()) {
                                Toast.makeText(context, "✅ ખરીદી બિલ સેવ થયું & ટ્રક $cleanTrk માં $totalBagsCount બોરી આપોઆપ ઉમેરાઈ ગઈ!", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "✅ ખરીદી બિલ સફળતાપૂર્વક સેવ થયું (વાહન વિના).", Toast.LENGTH_SHORT).show()
                            }
                        }

                        showConfirmDialog = false
                        resetForm()
                    }
                ) {
                    Text(if (editingPurchase != null) "હા, સુધારો" else "હા, સેવ કરો")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showConfirmDialog = false }) {
                    Text("રદ કરો")
                }
            }
        )
    }

    // Print / Share Dialog after Saving Bill
    if (savedPurchaseForPrint != null) {
        val pur = savedPurchaseForPrint!!
        AlertDialog(
            onDismissRequest = { savedPurchaseForPrint = null },
            icon = { Icon(Icons.Default.CheckCircle, contentDescription = null, tint = GreenPrimary, modifier = Modifier.size(36.dp)) },
            title = { Text("🎉 બિલ સફળતાપૂર્વક સેવ થયું!", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("બિલ નં: ${pur.billNo}", fontWeight = FontWeight.Bold)
                    Text("પાર્ટી: ${pur.partyName} ${if (pur.village.isNotEmpty()) "(${pur.village})" else ""}")
                    Text("કુલ બોરી: ${pur.items.sumOf { it.bags }} બોરી (${fmt(pur.items.sumOf { it.netWeightKg })} KG)")
                    Text("Net રકમ: ₹${fmt(pur.netTotal)}", fontWeight = FontWeight.Bold, color = GreenDark)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("આ બિલ પ્રિન્ટ કરવા અથવા WhatsApp પર શેર કરવા માટે નીચે 'પ્રિન્ટ / શેર' બટન દબાવો.", fontSize = 12.sp, color = Color(0xFF64748B))
                }
            },
            confirmButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            InvoicePdfHelper.printPurchaseVoucher(context, pur)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = GreenDark)
                    ) {
                        Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("🖨️ પ્રિન્ટ")
                    }
                    Button(
                        onClick = {
                            InvoicePdfHelper.sharePurchaseVoucherPdf(context, pur)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))
                    ) {
                        Icon(Icons.Default.PictureAsPdf, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("📄 વાઉચર PDF")
                    }
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { savedPurchaseForPrint = null }) {
                    Text("બંધ કરો")
                }
            }
        )
    }

    // Delete Confirmation Dialog
    if (purchaseToDelete != null) {
        val pur = purchaseToDelete!!
        AlertDialog(
            onDismissRequest = { purchaseToDelete = null },
            title = { Text("⚠️ ખરીદી રદ / ડીલીટ કરો") },
            text = {
                Column {
                    Text("શું તમે ખરેખર ખરીદી બિલ નં. ${pur.billNo} ડીલીટ કરવા માંગો છો?")
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "નોંધ: આ બિલ સાથે જોડાયેલ સ્ટોક રદ થશે અને ખાતાવહી/રોજમેળ આપમેળે અપડેટ થશે.",
                        fontSize = 12.sp,
                        color = Color(0xFFDC2626)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val bNo = pur.billNo
                        purchaseToDelete = null
                        onDeletePurchase(bNo)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Text("હા, ડીલીટ કરો")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { purchaseToDelete = null }) {
                    Text("રદ કરો")
                }
            }
        )
    }
}

fun sharePurchaseVoucher(context: Context, pur: PurchaseRecord) {
    InvoicePdfHelper.printPurchaseVoucher(context, pur)
}
