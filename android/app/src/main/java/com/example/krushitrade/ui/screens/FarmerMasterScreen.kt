package com.example.krushitrade.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Phone
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
import com.example.krushitrade.model.Farmer
import com.example.krushitrade.ui.theme.*

@Composable
fun FarmerMasterScreen(
    farmers: List<Farmer>,
    onAddFarmer: (Farmer) -> Unit
) {
    val context = LocalContext.current
    var showDialog by remember { mutableStateOf(false) }

    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var village by remember { mutableStateOf("") }
    var openingBal by remember { mutableStateOf("0") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = GreenPrimary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Farmer")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BgLight)
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "ખેડૂત / ગ્રાહક માસ્ટર (Farmer Master)",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = GreenDark
            )
            Text(
                text = "ખેડૂતોની યાદી, જૂનું લેણું અને WhatsApp ઉઘરાણી",
                fontSize = 12.sp,
                color = Color(0xFF64748B),
                modifier = Modifier.padding(bottom = 14.dp)
            )

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(farmers) { farmer ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(farmer.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("ગામ: ${farmer.village} | ${farmer.mobile}", fontSize = 12.sp, color = Color.Gray)
                                Text("ઉધાર મર્યાદા: ₹${farmer.creditLimit.toInt()}", fontSize = 11.sp, color = Color(0xFF64748B))
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    "₹${farmer.currentBalance.toInt()}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = if (farmer.currentBalance > 0) RedDanger else GreenPrimary
                                )
                                Text(
                                    if (farmer.currentBalance > 0) "બાકી ઉધાર" else "પૂરું ચૂકતે",
                                    fontSize = 11.sp,
                                    color = if (farmer.currentBalance > 0) RedDanger else GreenPrimary
                                )

                                if (farmer.currentBalance > 0 && farmer.mobile.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    IconButton(
                                        onClick = { sendUdharReminder(context, farmer) },
                                        modifier = Modifier.size(28.dp)
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

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("નવો ખેડૂત ઉમેરો", fontWeight = FontWeight.Bold, color = GreenDark) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("ખેડૂતનું નામ *") })
                    OutlinedTextField(value = mobile, onValueChange = { mobile = it }, label = { Text("મોબાઇલ નંબર") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
                    OutlinedTextField(value = village, onValueChange = { village = it }, label = { Text("ગામ / તાલુકો") })
                    OutlinedTextField(value = openingBal, onValueChange = { openingBal = it }, label = { Text("જૂનું બાકી ઉધાર ₹") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotEmpty()) {
                            onAddFarmer(
                                Farmer(
                                    name = name,
                                    mobile = mobile,
                                    village = village,
                                    openingBalance = openingBal.toDoubleOrNull() ?: 0.0,
                                    currentBalance = openingBal.toDoubleOrNull() ?: 0.0
                                )
                            )
                            showDialog = false
                            name = ""; mobile = ""; village = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                ) {
                    Text("સેવ કરો")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("રદ કરો") }
            }
        )
    }
}

fun sendUdharReminder(context: Context, farmer: Farmer) {
    try {
        val msg = "નમસ્તે શ્રી ${farmer.name}, કૃષિ ટ્રેડ તરફથી આપના ખાતાની બાકી રકમ ₹${farmer.currentBalance.toInt()} છે. જમા કરાવવા વિનંતી. આભાર!"
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("https://api.whatsapp.com/send?phone=91${farmer.mobile}&text=${Uri.encode(msg)}")
        }
        context.startActivity(intent)
    } catch (e: Exception) {}
}
