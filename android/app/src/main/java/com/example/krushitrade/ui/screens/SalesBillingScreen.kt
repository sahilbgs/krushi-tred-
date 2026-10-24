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

    var bagsInput by remember { mutableStateOf("1") }
    var looseKgInput by remember { mutableStateOf("0") }
    var rateInput by remember { mutableStateOf("140") }
    var discountInput by remember { mutableStateOf("0") }
    var paidInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }

    val bags = bagsInput.toIntOrNull() ?: 0
    val looseKg = looseKgInput.toDoubleOrNull() ?: 0.0
    val bagWeight = selectedStock?.bagWeightKg ?: 50.0
    val totalKg = (bags * bagWeight) + looseKg
    val rate = rateInput.toDoubleOrNull() ?: 0.0
    val lineTotal = totalKg * rate

    val discount = discountInput.toDoubleOrNull() ?: 0.0
    val netAmount = (lineTotal - discount).coerceAtLeast(0.0)
    val paid = if (paidInput.isEmpty()) netAmount else (paidInput.toDoubleOrNull() ?: 0.0)
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

                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = bagsInput,
                        onValueChange = { bagsInput = it },
                        label = { Text("બોરી (Bags)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )

                    OutlinedTextField(
                        value = looseKgInput,
                        onValueChange = { looseKgInput = it },
                        label = { Text("છૂટક કિલો (KG)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = "${totalKg} kg",
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
                Text("૩. રકમની ગણતરી", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("કુલ રકમ:")
                    Text("₹${lineTotal.toInt()}", fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = discountInput,
                        onValueChange = { discountInput = it },
                        label = { Text("ડિસ્કાઉન્ટ ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    OutlinedTextField(
                        value = paidInput,
                        onValueChange = { paidInput = it },
                        label = { Text("જમા રોકડ ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
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
                        if (due > 0) "બાકી ઉધાર રકમ:" else "ચૂકવવાપાત્ર:",
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

                val saleInvoice = SaleInvoice(
                    farmerId = selectedFarmer!!.id,
                    farmerName = selectedFarmer!!.name,
                    farmerMobile = selectedFarmer!!.mobile,
                    farmerVillage = selectedFarmer!!.village,
                    items = listOf(
                        SaleItem(
                            seedId = selectedStock!!.seedId,
                            varietyName = selectedStock!!.varietyName,
                            bagWeightKg = selectedStock!!.bagWeightKg,
                            bags = bags,
                            looseKg = looseKg,
                            totalWeightKg = totalKg,
                            rateUnit = "kg",
                            rate = rate,
                            itemTotal = lineTotal
                        )
                    ),
                    subTotal = lineTotal,
                    discount = discount,
                    netAmount = netAmount,
                    paidAmount = paid,
                    dueAmount = due,
                    paymentMode = "cash"
                )

                onSaveSale(saleInvoice)
                Toast.makeText(context, "બિલ તૈયાર થયું! સ્ટોક ઘટ્યો.", Toast.LENGTH_SHORT).show()

                // Share to WhatsApp
                if (selectedFarmer!!.mobile.isNotEmpty()) {
                    shareBillOnWhatsApp(context, saleInvoice)
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().height(52.dp)
        ) {
            Icon(Icons.Default.Print, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("સાદું બિલ બનાવો & WhatsApp મોકલો", fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
    }
}

fun shareBillOnWhatsApp(context: Context, sale: SaleInvoice) {
    try {
        val msg = "🌱 *કૃષિ ટ્રેડ - બિલ*\n" +
                "ખેડૂત: ${sale.farmerName}\n" +
                "બિયારણ: ${sale.items.firstOrNull()?.varietyName}\n" +
                "વજન: ${sale.items.sumOf { it.bags }} બોરી (${sale.items.sumOf { it.totalWeightKg }} kg)\n" +
                "કુલ રકમ: ₹${sale.netAmount.toInt()}\n" +
                "જમા: ₹${sale.paidAmount.toInt()}\n" +
                "*બાકી ઉધાર: ₹${sale.dueAmount.toInt()}*\n" +
                "આભાર! 🙏"

        val sendIntent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("https://api.whatsapp.com/send?phone=91${sale.farmerMobile}&text=${Uri.encode(msg)}")
        }
        context.startActivity(sendIntent)
    } catch (e: Exception) {
        // WhatsApp might not be installed
    }
}
