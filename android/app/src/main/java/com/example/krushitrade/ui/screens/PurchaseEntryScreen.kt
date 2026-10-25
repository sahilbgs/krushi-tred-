package com.example.krushitrade.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PurchaseEntryScreen(
    farmers: List<Party>,
    firms: List<Party>,
    traders: List<Party>,
    seeds: List<SeedProduct>,
    onSavePurchase: (PurchaseRecord) -> Unit
) {
    val context = LocalContext.current

    // Purchase Mode: "farmer" (ખેડૂત પાસેથી) or "market" (માર્કેટ પેઢી પાસેથી)
    var purchaseType by remember { mutableStateOf("farmer") }

    // Common fields
    var billNo by remember { mutableStateOf("SN-PUR-2026-0001") }
    var purchaseDate by remember { mutableStateOf("2026-10-25") }
    var paymentMode by remember { mutableStateOf("bank") }
    var paidInput by remember { mutableStateOf("") }
    var remarksInput by remember { mutableStateOf("") }

    // Mode 1: Farmer
    var selectedFarmer by remember { mutableStateOf<Party?>(farmers.firstOrNull()) }
    var farmerDropdownExpanded by remember { mutableStateOf(false) }
    var farmerVillage by remember { mutableStateOf(selectedFarmer?.village ?: "") }
    var majuriPerBagInput by remember { mutableStateOf("10") }

    // Mode 2: Market
    var selectedFirm by remember { mutableStateOf<Party?>(firms.firstOrNull()) }
    var firmDropdownExpanded by remember { mutableStateOf(false) }
    val filteredTraders = remember(selectedFirm) {
        traders.filter { selectedFirm == null || it.firmId == selectedFirm?.id }
    }
    var selectedTrader by remember { mutableStateOf<Party?>(filteredTraders.firstOrNull()) }
    var traderDropdownExpanded by remember { mutableStateOf(false) }
    var truckNoInput by remember { mutableStateOf("") }
    var truckOwnerInput by remember { mutableStateOf("") }
    var marketCommissionInput by remember { mutableStateOf("0") }
    var firmCommissionInput by remember { mutableStateOf("0") }
    var bardanExpenseInput by remember { mutableStateOf("0") }
    var marketMajuriInput by remember { mutableStateOf("0") }

    // Item adding state
    var selectedSeed by remember { mutableStateOf<SeedProduct?>(seeds.firstOrNull()) }
    var seedDropdownExpanded by remember { mutableStateOf(false) }
    var bagsInput by remember { mutableStateOf("20") }
    var lastBagKgInput by remember { mutableStateOf("35") }
    var ratePerManInput by remember { mutableStateOf("2400") }

    // Items List
    val itemsList = remember { mutableStateListOf<PurchaseItem>() }

    // Preview / Confirm Dialog
    var showConfirmDialog by remember { mutableStateOf(false) }

    // Calculations for currently typed item
    val curBags = bagsInput.toIntOrNull() ?: 0
    val curLastKg = lastBagKgInput.toDoubleOrNull() ?: BAG_STD_KG
    val curTotalKg = if (curBags > 0) ((curBags - 1) * BAG_STD_KG) + curLastKg else 0.0
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

    val netTotal = itemsSubTotal + calculatedExpenses
    val paidAmount = if (paidInput.isEmpty()) netTotal else (paidInput.toDoubleOrNull() ?: 0.0)
    val dueAmount = (netTotal - paidAmount).coerceAtLeast(0.0)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgLight)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Text(
            text = "SHREE NANDINI SEEDS",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = GreenDark
        )
        Text(
            text = "નવી બિયારણ ખરીદી (૧ બેગ = ૩૫ KG, ૧ મણ = ૨૦ KG)",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(bottom = 12.dp)
        )

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

        // Section 1: Party Details
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = if (purchaseType == "farmer") "૧. ખેડૂત વિગત" else "૧. પેઢી / વેપારી & ટ્રક વિગત",
                    fontWeight = FontWeight.Bold,
                    color = GreenDark
                )
                Spacer(modifier = Modifier.height(8.dp))

                if (purchaseType == "farmer") {
                    // Farmer Dropdown
                    ExposedDropdownMenuBox(
                        expanded = farmerDropdownExpanded,
                        onExpandedChange = { farmerDropdownExpanded = !farmerDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedFarmer?.name ?: "ખેડૂત પસંદ કરો",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("ખેડૂત પસંદ કરો") },
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
                                        farmerVillage = f.village
                                        farmerDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = farmerVillage,
                        onValueChange = { farmerVillage = it },
                        label = { Text("ગામ") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
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
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = truckNoInput,
                            onValueChange = { truckNoInput = it },
                            label = { Text("ટ્રક નં") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        OutlinedTextField(
                            value = truckOwnerInput,
                            onValueChange = { truckOwnerInput = it },
                            label = { Text("ટ્રક માલિક") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }
            }
        }

        // Section 2: Seed Variety, Bags & Rate Input
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૨. બિયારણ જાત, વજન અને ₹/મણ ભાવ", fontWeight = FontWeight.Bold, color = GreenDark)
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
                                    seedDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bagsInput,
                        onValueChange = { bagsInput = it },
                        label = { Text("કુલ બેગ") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )

                    OutlinedTextField(
                        value = lastBagKgInput,
                        onValueChange = { lastBagKgInput = it },
                        label = { Text("છેલ્લી બેગ (KG)") },
                        supportingText = { Text("0-35 KG") },
                        isError = (lastBagKgInput.toDoubleOrNull() ?: 0.0) > 35.0 || (lastBagKgInput.toDoubleOrNull() ?: 0.0) < 0.0,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = ratePerManInput,
                        onValueChange = { ratePerManInput = it },
                        label = { Text("ભાવ (₹/મણ)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
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
                        Text("કુલ KG: ${curTotalKg} kg", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("કુલ મણ: ${"%.2f".format(curTotalMan)} મણ", fontSize = 12.sp, color = GreenPrimary, fontWeight = FontWeight.Bold)
                        Text("રકમ: ₹${curItemTotal.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = {
                        val lastKg = lastBagKgInput.toDoubleOrNull() ?: 35.0
                        if (lastKg < 0.0 || lastKg > 35.0) {
                            Toast.makeText(context, "છેલ્લી બેગનું વજન 0 થી 35 KG હોવું જોઈએ!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (curBags <= 0 || selectedSeed == null) {
                            Toast.makeText(context, "યોગ્ય વિગત દાખલ કરો", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        itemsList.add(
                            PurchaseItem(
                                seedId = selectedSeed!!.id,
                                varietyName = selectedSeed!!.varietyName,
                                bags = curBags,
                                lastBagKg = lastKg,
                                netWeightKg = curTotalKg,
                                totalMan = curTotalMan,
                                ratePerMan = curRate,
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

        // Section 3: Added Items List
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
                                Text("${it.bags} બેગ | ${it.netWeightKg} KG (${"%.2f".format(it.totalMan)} મણ) @ ₹${it.ratePerMan.toInt()}", fontSize = 11.sp, color = Color(0xFF64748B))
                            }
                            Text("₹${it.itemTotal.toInt()}", fontWeight = FontWeight.Bold, color = GreenPrimary)
                            IconButton(onClick = { itemsList.removeAt(idx) }) {
                                Icon(Icons.Default.Delete, contentDescription = null, tint = Color.Red)
                            }
                        }
                        Divider(color = Color(0xFFF1F5F9))
                    }
                }
            }
        }

        // Section 4: Expenses & Net Total
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૩. ખર્ચ અને Net Total", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                if (purchaseType == "farmer") {
                    OutlinedTextField(
                        value = majuriPerBagInput,
                        onValueChange = { majuriPerBagInput = it },
                        label = { Text("મજૂરી પ્રતિ બેગ (₹/બેગ)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                } else {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = marketCommissionInput,
                            onValueChange = { marketCommissionInput = it },
                            label = { Text("માર્કેટ કમિશન") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        OutlinedTextField(
                            value = firmCommissionInput,
                            onValueChange = { firmCommissionInput = it },
                            label = { Text("પેઢી કમિશન") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = bardanExpenseInput,
                            onValueChange = { bardanExpenseInput = it },
                            label = { Text("બારદાન") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        OutlinedTextField(
                            value = marketMajuriInput,
                            onValueChange = { marketMajuriInput = it },
                            label = { Text("મજૂરી") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Net Total:", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = GreenDark)
                    Text("₹${netTotal.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = GreenDark)
                }

                Spacer(modifier = Modifier.height(6.dp))
                OutlinedTextField(
                    value = paidInput,
                    onValueChange = { paidInput = it },
                    label = { Text("ચૂકવેલ રકમ (Paid)") },
                    placeholder = { Text("દા.ત. ${netTotal.toInt()}") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                if (dueAmount > 0) {
                    Text(
                        text = "બાકી રકમ (Due): ₹${dueAmount.toInt()}",
                        color = Color(0xFFEA580C),
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Save Button
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
            colors = ButtonDefaults.buttonColors(containerColor = GreenDark),
            shape = RoundedCornerShape(10.dp)
        ) {
            Icon(Icons.Default.Check, contentDescription = null)
            Spacer(modifier = Modifier.width(6.dp))
            Text("ખરીદી સેવ કરો (Confirm Purchase)", fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
    }

    // Confirmation Dialog
    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = { Text("બિલ ખાતરી કરો") },
            text = {
                Column {
                    Text("કુલ બેગ: $totalBagsCount")
                    Text("કુલ વજન: $totalWeightKg KG (${"%.2f".format(totalManCount)} મણ)")
                    Text("Net Total: ₹${netTotal.toInt()}")
                    Text("ચૂકવેલ: ₹${paidAmount.toInt()} | બાકી: ₹${dueAmount.toInt()}")
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val party = if (purchaseType == "farmer") selectedFarmer else (selectedTrader ?: selectedFirm)
                        val record = PurchaseRecord(
                            id = "pur_${System.currentTimeMillis()}",
                            purchaseType = purchaseType,
                            billNo = billNo,
                            purchaseDate = purchaseDate,
                            partyId = party?.id ?: "",
                            partyName = party?.name ?: "",
                            village = if (purchaseType == "farmer") farmerVillage else (selectedFirm?.village ?: ""),
                            mobile = party?.mobile ?: "",
                            items = itemsList.toList(),
                            itemsSubTotal = itemsSubTotal,
                            majuriAmount = calculatedExpenses,
                            netTotal = netTotal,
                            paidAmount = paidAmount,
                            dueAmount = dueAmount,
                            paymentMode = paymentMode,
                            remarks = remarksInput,
                            createdBy = "Ravi Chaudhary (Main Admin)"
                        )
                        onSavePurchase(record)
                        showConfirmDialog = false
                        Toast.makeText(context, "ખરીદી સફળતાપૂર્વક સેવ થઈ ગઈ છે!", Toast.LENGTH_LONG).show()
                    }
                ) {
                    Text("હા, સેવ કરો")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showConfirmDialog = false }) {
                    Text("રદ કરો")
                }
            }
        )
    }
}
