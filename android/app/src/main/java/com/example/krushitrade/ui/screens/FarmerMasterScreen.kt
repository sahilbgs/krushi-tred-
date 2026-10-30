package com.example.krushitrade.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.example.krushitrade.model.Party
import com.example.krushitrade.ui.theme.*

// Party Category / Tag Definition matching Web Admin Panel
data class PartyTagOption(
    val type: String,
    val icon: String,
    val label: String,
    val subLabel: String,
    val tagColor: Color,
    val tagBg: Color
)

val ALL_PARTY_TAGS = listOf(
    PartyTagOption("farmer", "🌾", "ખેડૂત", "Farmer", Color(0xFF15803D), Color(0xFFDCFCE7)),
    PartyTagOption("firm", "🏢", "પેઢી", "Pedhi / Firm", Color(0xFF1E40AF), Color(0xFFDBEAFE)),
    PartyTagOption("supplier", "🚚", "સપ્લાયર", "Supplier", Color(0xFF7E22CE), Color(0xFFF3E8FF)),
    PartyTagOption("trader", "👤", "અન્ય વેપારી / વ્યક્તિ", "Trader / Person", Color(0xFFB45309), Color(0xFFFEF3C7)),
    PartyTagOption("transporter", "🚛", "ટ્રાન્સપોર્ટર", "Transporter", Color(0xFF475569), Color(0xFFF1F5F9))
)

fun getPartyTagInfo(type: String): PartyTagOption {
    val norm = type.lowercase().trim()
    return ALL_PARTY_TAGS.find { it.type == norm }
        ?: when (norm) {
            "customer" -> ALL_PARTY_TAGS[0]
            "other", "person" -> ALL_PARTY_TAGS[3]
            "truck_owner" -> ALL_PARTY_TAGS[4]
            else -> ALL_PARTY_TAGS[0]
        }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerMasterScreen(
    parties: List<Party>,
    onSaveParty: (Party) -> Unit
) {
    val context = LocalContext.current
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedTagFilter by remember { mutableStateOf("all") }
    var searchQuery by remember { mutableStateOf("") }

    // Dialog state for new party
    var partyType by remember { mutableStateOf("farmer") }
    var name by remember { mutableStateOf("") }
    var firmName by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var village by remember { mutableStateOf("") }
    var taluka by remember { mutableStateOf("") }
    var openingBal by remember { mutableStateOf("0") }
    var balanceType by remember { mutableStateOf("dr") } // "dr" (લેવાના) or "cr" (આપવાના)

    // Filter parties based on search and tag
    val filteredParties = remember(parties, selectedTagFilter, searchQuery) {
        parties.filter { p ->
            val matchTag = when (selectedTagFilter) {
                "all" -> true
                "farmer" -> p.partyType == "farmer" || p.partyType == "customer" || p.partyType.isEmpty()
                "firm" -> p.partyType == "firm"
                "supplier" -> p.partyType == "supplier"
                "trader" -> p.partyType == "trader" || p.partyType == "other" || p.partyType == "person"
                "transporter" -> p.partyType == "transporter" || p.partyType == "truck_owner"
                else -> p.partyType == selectedTagFilter
            }

            val q = searchQuery.trim().lowercase()
            val matchSearch = if (q.isEmpty()) true else {
                (p.name.lowercase().contains(q)) ||
                (p.firmName.lowercase().contains(q)) ||
                (p.mobile.contains(q)) ||
                (p.village.lowercase().contains(q))
            }

            matchTag && matchSearch
        }
    }

    // Counts for filter pills
    val farmerCount = parties.count { it.partyType == "farmer" || it.partyType == "customer" || it.partyType.isEmpty() }
    val firmCount = parties.count { it.partyType == "firm" }
    val supplierCount = parties.count { it.partyType == "supplier" }
    val traderCount = parties.count { it.partyType == "trader" || it.partyType == "other" || it.partyType == "person" }
    val transporterCount = parties.count { it.partyType == "transporter" || it.partyType == "truck_owner" }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    partyType = "farmer"
                    name = ""
                    firmName = ""
                    mobile = ""
                    village = ""
                    taluka = ""
                    openingBal = "0"
                    balanceType = "dr"
                    showAddDialog = true
                },
                containerColor = GreenPrimary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Party")
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
                        text = "ખાતેદાર / પાર્ટી માસ્ટર",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = GreenDark
                    )
                    Text(
                        text = "ખેડૂત, પેઢી, સપ્લાયર, વેપારી અને ટ્રાન્સપોર્ટર ખાતાવહી",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B)
                    )
                }

                Button(
                    onClick = {
                        partyType = "farmer"
                        name = ""
                        firmName = ""
                        mobile = ""
                        village = ""
                        taluka = ""
                        openingBal = "0"
                        balanceType = "dr"
                        showAddDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("નવો ઉમેરો", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("🔍 નામ, પેઢી, ગામ કે નંબર શોધો...", fontSize = 13.sp) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                )
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Tag Filter Pills (Scrollable)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = selectedTagFilter == "all",
                    onClick = { selectedTagFilter = "all" },
                    label = { Text("બધા (${parties.size})", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                )
                FilterChip(
                    selected = selectedTagFilter == "farmer",
                    onClick = { selectedTagFilter = "farmer" },
                    label = { Text("🌾 ખેડૂત ($farmerCount)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                )
                FilterChip(
                    selected = selectedTagFilter == "firm",
                    onClick = { selectedTagFilter = "firm" },
                    label = { Text("🏢 પેઢી ($firmCount)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                )
                FilterChip(
                    selected = selectedTagFilter == "supplier",
                    onClick = { selectedTagFilter = "supplier" },
                    label = { Text("🚚 સપ્લાયર ($supplierCount)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                )
                FilterChip(
                    selected = selectedTagFilter == "trader",
                    onClick = { selectedTagFilter = "trader" },
                    label = { Text("👤 વેપારી ($traderCount)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                )
                FilterChip(
                    selected = selectedTagFilter == "transporter",
                    onClick = { selectedTagFilter = "transporter" },
                    label = { Text("🚛 ટ્રાન્સપોર્ટર ($transporterCount)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Party List
            if (filteredParties.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "કોઈ ખાતેદાર મળ્યા નથી.",
                        color = Color.Gray,
                        fontSize = 14.sp
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredParties, key = { it.id.ifEmpty { it.name + it.mobile } }) { party ->
                        val tag = getPartyTagInfo(party.partyType)
                        val isDr = party.balanceType.lowercase() == "dr"
                        val bal = party.currentBalance

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Tag Badge
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = tag.tagBg,
                                        modifier = Modifier.padding(bottom = 4.dp)
                                    ) {
                                        Text(
                                            text = "${tag.icon} ${tag.label}",
                                            color = tag.tagColor,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }

                                    // Balance info
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = "₹${bal.toInt()}",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = if (bal <= 0) GreenPrimary else if (isDr) RedDanger else Color(0xFF1E40AF)
                                        )
                                        Text(
                                            text = if (bal <= 0) "પૂરું ચૂકતે" else if (isDr) "બાકી લેવાના (DR)" else "બાકી આપવાના (CR)",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = if (bal <= 0) GreenPrimary else if (isDr) RedDanger else Color(0xFF1E40AF)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                // Name & Firm
                                Text(
                                    text = party.name,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = Color(0xFF0F172A)
                                )

                                if (party.firmName.isNotEmpty() && party.firmName != party.name) {
                                    Text(
                                        text = "પેઢી / સંપર્ક: ${party.firmName}",
                                        fontSize = 12.sp,
                                        color = Color(0xFF475569)
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                // Village & Mobile with Actions
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        if (party.village.isNotEmpty()) {
                                            Text(
                                                text = "📍 ગામ: ${party.village}",
                                                fontSize = 12.sp,
                                                color = Color(0xFF64748B)
                                            )
                                        }
                                        if (party.mobile.isNotEmpty()) {
                                            Text(
                                                text = "📞 ${party.mobile}",
                                                fontSize = 12.sp,
                                                color = Color(0xFF64748B)
                                            )
                                        }
                                    }

                                    // Action Buttons (WhatsApp & Call)
                                    if (party.mobile.isNotEmpty()) {
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            IconButton(
                                                onClick = {
                                                    try {
                                                        val intent = Intent(Intent.ACTION_DIAL).apply {
                                                            data = Uri.parse("tel:${party.mobile}")
                                                        }
                                                        context.startActivity(intent)
                                                    } catch (_: Exception) {}
                                                },
                                                modifier = Modifier.size(32.dp)
                                            ) {
                                                Icon(Icons.Default.Phone, contentDescription = "Call", tint = Color(0xFF2563EB))
                                            }

                                            IconButton(
                                                onClick = { sendPartyWhatsApp(context, party) },
                                                modifier = Modifier.size(32.dp)
                                            ) {
                                                Icon(Icons.Default.Message, contentDescription = "WhatsApp", tint = Color(0xFF25D366))
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

    // Add New Party Dialog with full Tag Selector
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = {
                Text(
                    "નવો ખાતેદાર / પાર્ટી ઉમેરો",
                    fontWeight = FontWeight.Bold,
                    color = GreenDark,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // 1. Tag Selector (વર્ગીકરણ)
                    Text(
                        "પાર્ટી ટેગ (વર્ગીકરણ) પસંદ કરો:*",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = GreenDark
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        ALL_PARTY_TAGS.forEach { tagOpt ->
                            val isSelected = partyType == tagOpt.type
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) tagOpt.tagBg else Color(0xFFF8FAFC),
                                border = if (isSelected) androidx.compose.foundation.BorderStroke(1.5.dp, tagOpt.tagColor) else androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        partyType = tagOpt.type
                                        // Auto set balance type: farmer is dr (લેવાના), others are cr (આપવાના)
                                        balanceType = if (tagOpt.type == "farmer") "dr" else "cr"
                                    }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 10.dp, vertical = 7.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(tagOpt.icon, fontSize = 16.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = tagOpt.label,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                            fontSize = 13.sp,
                                            color = if (isSelected) tagOpt.tagColor else Color(0xFF1E293B)
                                        )
                                        Text(
                                            text = tagOpt.subLabel,
                                            fontSize = 10.sp,
                                            color = Color(0xFF64748B)
                                        )
                                    }
                                    if (isSelected) {
                                        Icon(
                                            Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = tagOpt.tagColor,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // 2. Name field (dynamic label)
                    val isFirmOrSupplierOrTrans = partyType in listOf("firm", "supplier", "transporter")
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text(if (isFirmOrSupplierOrTrans) "કંપની / પેઢીનું નામ *" else "પૂરું નામ *") },
                        placeholder = {
                            Text(
                                when (partyType) {
                                    "firm" -> "દા.ત. શ્રી ગણેશ ટ્રેડિંગ કંપની"
                                    "supplier" -> "દા.ત. ગોકુલ સીડ્સ સપ્લાયર્સ"
                                    "transporter" -> "દા.ત. પટેલ રોડવેઝ / ટ્રક માલિક"
                                    else -> "દા.ત. રમેશભાઈ પટેલ"
                                }
                            )
                        },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 3. Contact Person (for firm, supplier, transporter)
                    if (isFirmOrSupplierOrTrans) {
                        OutlinedTextField(
                            value = firmName,
                            onValueChange = { firmName = it },
                            label = { Text("સંપર્ક વ્યક્તિ / માલિકનું નામ") },
                            placeholder = { Text("વેપારી / ડ્રાઈવરનું નામ") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // 4. Mobile
                    OutlinedTextField(
                        value = mobile,
                        onValueChange = { mobile = it },
                        label = { Text("મોબાઇલ નંબર") },
                        placeholder = { Text("10 અંકનો મોબાઇલ") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 5. Village / City
                    OutlinedTextField(
                        value = village,
                        onValueChange = { village = it },
                        label = { Text("ગામ / શહેર / માર્કેટ યાર્ડ") },
                        placeholder = { Text("દા.ત. ગોંડલ, જેતપુર") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 6. Taluka
                    OutlinedTextField(
                        value = taluka,
                        onValueChange = { taluka = it },
                        label = { Text("તાલુકો") },
                        placeholder = { Text("તાલુકો") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 7. Opening Balance
                    OutlinedTextField(
                        value = openingBal,
                        onValueChange = { openingBal = it },
                        label = { Text("જૂની બાકી રકમ (Opening Balance) ₹") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 8. Balance Type (Dr vs Cr)
                    Text("બાકી રકમ પ્રકાર:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF334155))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { balanceType = "dr" },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (balanceType == "dr") RedDanger else Color(0xFFE2E8F0),
                                contentColor = if (balanceType == "dr") Color.White else Color(0xFF334155)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(vertical = 6.dp)
                        ) {
                            Text("લેવાના (Dr / ઉધાર)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = { balanceType = "cr" },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (balanceType == "cr") Color(0xFF1E40AF) else Color(0xFFE2E8F0),
                                contentColor = if (balanceType == "cr") Color.White else Color(0xFF334155)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(vertical = 6.dp)
                        ) {
                            Text("આપવાના (Cr / જમા)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            val op = openingBal.toDoubleOrNull() ?: 0.0
                            val isFirmType = partyType in listOf("firm", "supplier", "transporter")
                            val createdParty = Party(
                                id = "party_${System.currentTimeMillis()}",
                                partyType = partyType,
                                name = name.trim(),
                                firmName = firmName.trim().ifEmpty { if (isFirmType) name.trim() else "" },
                                mobile = mobile.trim(),
                                village = village.trim(),
                                openingBalance = op,
                                currentBalance = op,
                                balanceType = balanceType
                            )
                            onSaveParty(createdParty)
                            showAddDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                    enabled = name.isNotBlank()
                ) {
                    Text("સેવ કરો", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("રદ કરો")
                }
            }
        )
    }
}

fun sendPartyWhatsApp(context: Context, party: Party) {
    try {
        val clean = party.mobile.filter { it.isDigit() }
        val num = if (clean.length == 10) "91$clean" else clean
        val bal = party.currentBalance.toInt()
        val balText = if (party.balanceType.lowercase() == "dr") "લેવાના (ઉધાર)" else "આપવાના (જમા)"
        val msg = "નમસ્તે શ્રી ${party.name}, SHREE NANDINI SEEDS તરફથી આપના ખાતાની બાકી રકમ ₹$bal $balText છે. આભાર!"
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("https://api.whatsapp.com/send?phone=$num&text=${Uri.encode(msg)}")
        }
        context.startActivity(intent)
    } catch (_: Exception) {}
}
