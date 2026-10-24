package com.example.krushitrade.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AllInbox
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
    suppliers: List<Supplier>,
    seeds: List<SeedProduct>,
    onSavePurchase: (PurchaseRecord) -> Unit
) {
    val context = LocalContext.current
    var selectedSupplier by remember { mutableStateOf<Supplier?>(suppliers.firstOrNull()) }
    var selectedSeed by remember { mutableStateOf<SeedProduct?>(seeds.firstOrNull()) }
    var supExpanded by remember { mutableStateOf(false) }
    var seedExpanded by remember { mutableStateOf(false) }

    var invoiceNo by remember { mutableStateOf("") }
    var truckNoInput by remember { mutableStateOf("") }
    var bagsInput by remember { mutableStateOf("20") }
    var purchaseRateInput by remember { mutableStateOf("120") }
    var majuriInput by remember { mutableStateOf("0") }
    var extraChargesInput by remember { mutableStateOf("0") }
    var paidInput by remember { mutableStateOf("") }

    val bags = bagsInput.toIntOrNull() ?: 0
    val bagWeight = selectedSeed?.bagWeightKg ?: 50.0
    val totalWeightKg = bags * bagWeight
    val rate = purchaseRateInput.toDoubleOrNull() ?: 0.0
    val majuri = majuriInput.toDoubleOrNull() ?: 0.0
    val extra = extraChargesInput.toDoubleOrNull() ?: 0.0
    val totalAmount = (totalWeightKg * rate) + majuri + extra
    val paid = if (paidInput.isEmpty()) totalAmount else (paidInput.toDoubleOrNull() ?: 0.0)
    val due = (totalAmount - paid).coerceAtLeast(0.0)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgLight)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "નવી બિયારણ ખરીદી (Purchase Inward)",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = GreenDark
        )
        Text(
            text = "સપ્લાયર પાસેથી માલ સ્ટોકમાં ઉમેરો (બોરી & કિલો વધારો)",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Supplier selection
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૧. સપ્લાયર વિગત", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                ExposedDropdownMenuBox(
                    expanded = supExpanded,
                    onExpandedChange = { supExpanded = !supExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedSupplier?.companyName ?: "સપ્લાયર પસંદ કરો",
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = supExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = supExpanded,
                        onDismissRequest = { supExpanded = false }
                    ) {
                        suppliers.forEach { sup ->
                            DropdownMenuItem(
                                text = { Text("${sup.companyName} (${sup.city})") },
                                onClick = {
                                    selectedSupplier = sup
                                    supExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = invoiceNo,
                    onValueChange = { invoiceNo = it },
                    label = { Text("ઇન્વોઇસ / ચલણ નં.") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = truckNoInput,
                    onValueChange = { truckNoInput = it },
                    label = { Text("ટ્રક / વાહન નંબર (દા.ત. GJ-11-AB-1234)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )
            }
        }

        // Seed & Inward details
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૨. બિયારણ & સ્ટોક ઇન્વર્ડ", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                ExposedDropdownMenuBox(
                    expanded = seedExpanded,
                    onExpandedChange = { seedExpanded = !seedExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedSeed?.varietyName ?: "બિયારણ પસંદ કરો",
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = seedExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = seedExpanded,
                        onDismissRequest = { seedExpanded = false }
                    ) {
                        seeds.forEach { seed ->
                            DropdownMenuItem(
                                text = { Text("${seed.varietyName} (${seed.bagWeightKg} kg)") },
                                onClick = {
                                    selectedSeed = seed
                                    seedExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

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
                        value = "$totalWeightKg kg",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("કુલ વજન (Net KG)") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = purchaseRateInput,
                    onValueChange = { purchaseRateInput = it },
                    label = { Text("ખરીદી ભાવ (₹ પ્રતિ કિલો) *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )
            }
        }

        // Calculation & Save
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("૩. ચુકવણી ગણતરી", fontWeight = FontWeight.Bold, color = GreenDark)
                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("કુલ ખરીદી રકમ:")
                    Text("₹${totalAmount.toInt()}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = majuriInput,
                        onValueChange = { majuriInput = it },
                        label = { Text("મજૂરી ખર્ચ ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    OutlinedTextField(
                        value = extraChargesInput,
                        onValueChange = { extraChargesInput = it },
                        label = { Text("ટ્રક ભાડું / અન્ય ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = paidInput,
                    onValueChange = { paidInput = it },
                    label = { Text("સપ્લાયરને ચૂકવેલ રકમ ₹") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (due > 0) Color(0xFFFEE2E2) else Color(0xFFDCFCE7), RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("સપ્લાયરને બાકી રકમ:", fontWeight = FontWeight.Bold, color = if (due > 0) RedDanger else GreenDark)
                    Text("₹${due.toInt()}", fontWeight = FontWeight.Bold, color = if (due > 0) RedDanger else GreenDark)
                }
            }
        }

        Button(
            onClick = {
                if (selectedSupplier == null || selectedSeed == null || bags <= 0) {
                    Toast.makeText(context, "બધી વિગતો ભરો", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                val genInv = if (invoiceNo.isEmpty()) "PUR-${System.currentTimeMillis().toString().takeLast(6)}" else invoiceNo
                val purchaseRecord = PurchaseRecord(
                    invoiceNo = genInv,
                    truckNo = truckNoInput,
                    supplierId = selectedSupplier!!.id,
                    supplierName = selectedSupplier!!.companyName,
                    items = listOf(
                        PurchaseItem(
                            seedId = selectedSeed!!.id,
                            varietyName = selectedSeed!!.varietyName,
                            bagWeightKg = bagWeight,
                            bags = bags,
                            netWeightKg = totalWeightKg,
                            rateType = "kg",
                            purchaseRate = rate,
                            itemTotal = totalWeightKg * rate
                        )
                    ),
                    majuriAmount = majuri,
                    extraCharges = extra,
                    totalAmount = totalAmount,
                    paidAmount = paid,
                    dueAmount = due
                )

                onSavePurchase(purchaseRecord)
                Toast.makeText(context, "ખરીદી સેવ થઈ અને સ્ટોક વધારાયો!", Toast.LENGTH_SHORT).show()
            },
            colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().height(52.dp)
        ) {
            Icon(Icons.Default.Check, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("ખરીદી સેવ કરો & સ્ટોક વધારો", fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
    }
}
