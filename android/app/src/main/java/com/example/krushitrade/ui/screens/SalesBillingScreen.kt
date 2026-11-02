package com.example.krushitrade.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesBillingScreen(
    farmers: List<Farmer>,
    stock: List<StockItem>,
    onSaveSale: (SaleInvoice) -> Unit
) {
    val context = LocalContext.current

    var selectedFarmer by remember { mutableStateOf<Farmer?>(farmers.firstOrNull()) }
    var selectedStock by remember { mutableStateOf<StockItem?>(stock.firstOrNull()) }
    var farmerExpanded by remember { mutableStateOf(false) }
    var stockExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(farmers) {
        if (selectedFarmer == null && farmers.isNotEmpty()) {
            selectedFarmer = farmers.firstOrNull()
        }
    }
    LaunchedEffect(stock) {
        if (selectedStock == null && stock.isNotEmpty()) {
            selectedStock = stock.firstOrNull()
        }
    }

    var bags1Input by remember { mutableStateOf("1") }
    var kg1Input by remember { mutableStateOf("35") }
    var bags2Input by remember { mutableStateOf("0") }
    var kg2Input by remember { mutableStateOf("0") }
    var rateInput by remember { mutableStateOf("140") }
    var majuriInput by remember { mutableStateOf("0") }
    var extraChargesInput by remember { mutableStateOf("0") }
    var discountInput by remember { mutableStateOf("0") }
    var isUdhar by remember { mutableStateOf(false) }
    var paidInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }
    var savedSaleForPrint by remember { mutableStateOf<SaleInvoice?>(null) }

    LaunchedEffect(selectedStock) {
        if (selectedStock != null) {
            val bagW = selectedStock!!.bagWeightKg
            kg1Input = if (bagW % 1.0 == 0.0) bagW.toInt().toString() else bagW.toString()
        }
    }

    val curB1 = bags1Input.toIntOrNull() ?: 0
    val curK1 = kg1Input.toDoubleOrNull() ?: 35.0
    val curB2 = bags2Input.toIntOrNull() ?: 0
    val curK2 = kg2Input.toDoubleOrNull() ?: 0.0

    val totalBags = curB1 + curB2
    val totalKg = (curB1 * curK1) + (curB2 * curK2)
    val totalMan = totalKg / 20.0
    val rate = rateInput.toDoubleOrNull() ?: 0.0
    val lineTotal = totalKg * rate

    val majuri = majuriInput.toDoubleOrNull() ?: 0.0
    val extra = extraChargesInput.toDoubleOrNull() ?: 0.0
    val discount = discountInput.toDoubleOrNull() ?: 0.0
    val netAmount = (lineTotal - discount + majuri + extra).coerceAtLeast(0.0)
    val paid = if (isUdhar) 0.0 else (if (paidInput.isEmpty()) netAmount else (paidInput.toDoubleOrNull() ?: 0.0))
    val due = (netAmount - paid).coerceAtLeast(0.0)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgLight)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "નવું સાદું વેચાણ બિલ (New Bill)",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = GreenDark
        )
        Text(
            text = "ખેડૂતનું બિલ બનાવો અને સ્ટોકમાંથી બોરી-કિલો ઘટાડો",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        if (errorMessage.isNotEmpty()) {
            Text(
                text = errorMessage,
                color = RedDanger,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // Section 1: Farmer Selection
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૧. ખેડૂત પસંદ કરો", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                ExposedDropdownMenuBox(
                    expanded = farmerExpanded,
                    onExpandedChange = { farmerExpanded = !farmerExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedFarmer?.name ?: "ખેડૂત પસંદ કરો",
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = farmerExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = farmerExpanded,
                        onDismissRequest = { farmerExpanded = false }
                    ) {
                        farmers.forEach { farmer ->
                            DropdownMenuItem(
                                text = { Text("${farmer.name} (${farmer.village})") },
                                onClick = {
                                    selectedFarmer = farmer
                                    farmerExpanded = false
                                }
                            )
                        }
                    }
                }

                selectedFarmer?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("ગામ: ${it.village} | મો: ${it.mobile}", fontSize = 12.sp, color = Color.Gray)
                    if (it.currentBalance > 0) {
                        Text("જૂનું બાકી ઉધાર: ₹${it.currentBalance.toInt()}", fontSize = 12.sp, color = RedDanger, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Section 2: Seed & Bags + Loose KG
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૨. બિયારણ, બોરી & કિલો વિગત", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                ExposedDropdownMenuBox(
                    expanded = stockExpanded,
                    onExpandedChange = { stockExpanded = !stockExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedStock?.let { it.varietyName } ?: "બિયારણ પસંદ કરો",
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = stockExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = stockExpanded,
                        onDismissRequest = { stockExpanded = false }
                    ) {
                        stock.forEach { item ->
                            DropdownMenuItem(
                                text = { Text("${item.varietyName} (${item.availableBags} બોરી + ${item.availableLooseKg} kg)") },
                                onClick = {
                                    selectedStock = item
                                    stockExpanded = false
                                }
                            )
                        }
                    }
                }

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
                            Text("સબ-ટોટલ: ${curB1 * curK1} KG", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
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
                            Text("સબ-ટોટલ: ${curB2 * curK2} KG", fontSize = 11.sp, color = Color(0xFF92400E), fontWeight = FontWeight.SemiBold)
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

                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = "$totalBags બોરી (${totalKg} kg)",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("કુલ વજન (Net KG)") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )

                    OutlinedTextField(
                        value = rateInput,
                        onValueChange = { rateInput = it },
                        label = { Text("ભાવ ₹/kg") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
        }

        // Section 3: Summary and Generation
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૩. મજૂરી, અન્ય ખર્ચ & ચુકવણી (રોકડ/ઉધાર)", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(10.dp))

                // Cash vs Udhar Quick Toggle
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { isUdhar = false },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (!isUdhar) GreenPrimary else Color(0xFFE2E8F0),
                            contentColor = if (!isUdhar) Color.White else Color(0xFF334155)
                        ),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("🟢 રોકડ (Cash)", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { isUdhar = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isUdhar) RedDanger else Color(0xFFE2E8F0),
                            contentColor = if (isUdhar) Color.White else Color(0xFF334155)
                        ),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("🔴 ઉધાર (Udhar)", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = majuriInput,
                        onValueChange = { majuriInput = it },
                        label = { Text("મજૂરી ખર્ચ ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    OutlinedTextField(
                        value = extraChargesInput,
                        onValueChange = { extraChargesInput = it },
                        label = { Text("અન્ય ચાર્જિસ ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = discountInput,
                        onValueChange = { discountInput = it },
                        label = { Text("ડિસ્કાઉન્ટ ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    if (!isUdhar) {
                        OutlinedTextField(
                            value = paidInput,
                            onValueChange = { paidInput = it },
                            label = { Text("જમા રોકડ ₹") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (due > 0) Color(0xFFFEE2E2) else Color(0xFFDCFCE7), RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        if (due > 0) "બાકી ઉધાર રકમ (ખાતામાં):" else "કુલ ચૂકવવાપાત્ર:",
                        fontWeight = FontWeight.Bold,
                        color = if (due > 0) RedDanger else GreenDark
                    )
                    Text(
                        "₹${if (due > 0) due.toInt() else netAmount.toInt()}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = if (due > 0) RedDanger else GreenDark
                    )
                }
            }
        }

        // Submit Button
        Button(
            onClick = {
                if (selectedFarmer == null) {
                    errorMessage = "ખેડૂત પસંદ કરો"
                    return@Button
                }
                if (selectedStock == null || totalKg <= 0) {
                    errorMessage = "માન્ય બોરી અથવા કિલો દાખલ કરો"
                    return@Button
                }

                val autoBillNo = "KT-2026-" + System.currentTimeMillis().toString().takeLast(5)
                val saleInvoice = SaleInvoice(
                    billNo = autoBillNo,
                    farmerId = selectedFarmer!!.id,
                    farmerName = selectedFarmer!!.name,
                    farmerMobile = selectedFarmer!!.mobile,
                    farmerVillage = selectedFarmer!!.village,
                    items = listOf(
                        SaleItem(
                            seedId = selectedStock!!.seedId,
                            varietyName = selectedStock!!.varietyName,
                            bagWeightKg = curK1,
                            bags1 = curB1,
                            kg1 = curK1,
                            bags2 = curB2,
                            kg2 = curK2,
                            bags = totalBags,
                            looseKg = if (curB2 > 0) curB2 * curK2 else 0.0,
                            totalWeightKg = totalKg,
                            totalMan = totalMan,
                            rateUnit = "kg",
                            rate = rate,
                            itemTotal = lineTotal
                        )
                    ),
                    subTotal = lineTotal,
                    majuriAmount = majuri,
                    extraCharges = extra,
                    discount = discount,
                    netAmount = netAmount,
                    paidAmount = paid,
                    dueAmount = due,
                    paymentMode = if (isUdhar) "credit" else "cash"
                )

                onSaveSale(saleInvoice)
                savedSaleForPrint = saleInvoice
                Toast.makeText(context, "બિલ તૈયાર થયું! સ્ટોક ઘટ્યો.", Toast.LENGTH_SHORT).show()
            },
            colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().height(52.dp)
        ) {
            Icon(Icons.Default.Print, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("સાદું બિલ બનાવો (Save Bill)", fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
    }

    // Print / Share Dialog after Saving Sale Bill
    if (savedSaleForPrint != null) {
        val sale = savedSaleForPrint!!
        val it = sale.items.firstOrNull()
        val breakdown = if ((it?.bags2 ?: 0) > 0) "${it?.bags1}×${it?.kg1}kg + ${it?.bags2}×${it?.kg2}kg" else "${it?.bags1}×${it?.kg1}kg"

        AlertDialog(
            onDismissRequest = { savedSaleForPrint = null },
            icon = { Icon(Icons.Default.CheckCircle, contentDescription = null, tint = GreenPrimary, modifier = Modifier.size(36.dp)) },
            title = { Text("🎉 વેચાણ બિલ સફળતાપૂર્વક બન્યું!", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("બિલ નં: ${sale.billNo}", fontWeight = FontWeight.Bold)
                    Text("ખેડૂત: ${sale.farmerName} ${if (sale.farmerVillage.isNotEmpty()) "(${sale.farmerVillage})" else ""}")
                    Text("બિયારણ: ${it?.varietyName}")
                    Text("વજન: ${sale.items.sumOf { it.bags }} બોરી ($breakdown = ${sale.items.sumOf { it.totalWeightKg }} kg)")
                    Text("કુલ રકમ: ₹${sale.netAmount.toInt()}", fontWeight = FontWeight.Bold, color = GreenDark)
                    if (sale.dueAmount > 0) {
                        Text("બાકી ઉધાર: ₹${sale.dueAmount.toInt()}", fontWeight = FontWeight.Bold, color = RedDanger)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("આ બિલ પ્રિન્ટ કરવા અથવા WhatsApp પર મોકલવા માટે નીચેનું બટન પસંદ કરો:", fontSize = 12.sp, color = Color(0xFF64748B))
                }
            },
            confirmButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            shareSaleReceipt(context, sale)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = GreenDark)
                    ) {
                        Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("🖨️ પ્રિન્ટ / શેર")
                    }
                    if (sale.farmerMobile.isNotBlank()) {
                        Button(
                            onClick = {
                                shareBillOnWhatsApp(context, sale)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))
                        ) {
                            Text("💬 WhatsApp")
                        }
                    }
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { savedSaleForPrint = null }) {
                    Text("બંધ કરો")
                }
            }
        )
    }
}

fun shareSaleReceipt(context: Context, sale: SaleInvoice) {
    try {
        val item = sale.items.firstOrNull() ?: SaleItem()
        val breakdown = if (item.bags2 > 0) "${item.bags1}×${if (item.kg1 % 1.0 == 0.0) item.kg1.toInt() else item.kg1}kg + ${item.bags2}×${if (item.kg2 % 1.0 == 0.0) item.kg2.toInt() else item.kg2}kg" else "${item.bags1}×${if (item.kg1 % 1.0 == 0.0) item.kg1.toInt() else item.kg1}kg"
        val text = "🧾 *શ્રી નંદિની સીડ્સ - વેચાણ બિલ*\n" +
                "------------------------------------\n" +
                "બિલ નં: ${sale.billNo}\n" +
                "ખેડૂત: ${sale.farmerName} ${if (sale.farmerVillage.isNotEmpty()) "(${sale.farmerVillage})" else ""}\n" +
                (if (sale.farmerMobile.isNotEmpty()) "મોબાઈલ: ${sale.farmerMobile}\n" else "") +
                "------------------------------------\n" +
                "બિયારણ: ${item.varietyName}\n" +
                "બોરી: ${sale.items.sumOf { it.bags }} બોરી ($breakdown)\n" +
                "કુલ વજન: ${sale.items.sumOf { it.totalWeightKg }} KG (${sale.items.sumOf { it.totalMan }} મણ)\n" +
                "ભાવ: ₹${item.rate} / ${item.rateUnit}\n" +
                "માલ રકમ: ₹${sale.subTotal.toInt()}\n" +
                (if (sale.majuriAmount > 0) "મજૂરી: ₹${sale.majuriAmount.toInt()}\n" else "") +
                (if (sale.extraCharges > 0) "અન્ય ચાર્જ: ₹${sale.extraCharges.toInt()}\n" else "") +
                (if (sale.discount > 0) "ડિસ્કાઉન્ટ: -₹${sale.discount.toInt()}\n" else "") +
                "------------------------------------\n" +
                "*કુલ રકમ: ₹${sale.netAmount.toInt()}*\n" +
                "ચુકવેલ: ₹${sale.paidAmount.toInt()}\n" +
                (if (sale.dueAmount > 0) "*બાકી ઉધાર: ₹${sale.dueAmount.toInt()}*\n" else "") +
                "ચુકવણી: ${if (sale.paymentMode == "credit") "ઉધાર (બાકી)" else "રોકડ (Cash)"}\n" +
                "------------------------------------\n" +
                "આભાર! ફરી પધારજો 🙏\n" +
                "શ્રી નંદિની સીડ્સ | કૃષિ ટ્રેડ"

        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            putExtra(Intent.EXTRA_TEXT, text)
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, "🖨️ વેચાણ બિલ પ્રિન્ટ / શેર કરો")
        context.startActivity(shareIntent)
    } catch (e: Exception) {
        Toast.makeText(context, "શેર કરવામાં ભૂલ આવી", Toast.LENGTH_SHORT).show()
    }
}

fun shareBillOnWhatsApp(context: Context, sale: SaleInvoice) {
    try {
        val item = sale.items.firstOrNull() ?: SaleItem()
        val breakdown = if (item.bags2 > 0) "${item.bags1}×${if (item.kg1 % 1.0 == 0.0) item.kg1.toInt() else item.kg1}kg + ${item.bags2}×${if (item.kg2 % 1.0 == 0.0) item.kg2.toInt() else item.kg2}kg" else "${item.bags1}×${if (item.kg1 % 1.0 == 0.0) item.kg1.toInt() else item.kg1}kg"
        val msg = "🌱 *શ્રી નંદિની સીડ્સ - બિલ*\n" +
                "બિલ નં: ${sale.billNo}\n" +
                "ખેડૂત: ${sale.farmerName}\n" +
                "બિયારણ: ${item.varietyName}\n" +
                "વજન: ${sale.items.sumOf { it.bags }} બોરી ($breakdown = ${sale.items.sumOf { it.totalWeightKg }} kg)\n" +
                "કુલ રકમ: ₹${sale.netAmount.toInt()}\n" +
                "જમા ચૂકવેલ: ₹${sale.paidAmount.toInt()}\n" +
                (if (sale.dueAmount > 0) "*બાકી ઉધાર: ₹${sale.dueAmount.toInt()}*\n" else "") +
                "આભાર! ફરી પધારજો 🙏"

        val sendIntent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("https://api.whatsapp.com/send?phone=91${sale.farmerMobile}&text=${Uri.encode(msg)}")
        }
        context.startActivity(sendIntent)
    } catch (e: Exception) {
        // WhatsApp might not be installed
    }
}
