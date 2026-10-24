package com.example.krushitrade.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.krushitrade.model.StockItem
import com.example.krushitrade.ui.theme.*

@Composable
fun StockLedgerScreen(stock: List<StockItem>) {
    var searchQuery by remember { mutableStateOf("") }

    val filtered = stock.filter {
        it.varietyName.contains(searchQuery, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgLight)
            .padding(16.dp)
    ) {
        Text(
            text = "ગોડાઉન સ્ટોક લેજર (Stock Ledger)",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = GreenDark
        )
        Text(
            text = "બોરી અને કિલો બંને એકમોમાં જીવંત સ્ટોક",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(bottom = 12.dp)
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("બિયારણની જાત શોધો...") },
            modifier = Modifier.fillMaxWidth().padding(bottom = 14.dp),
            shape = RoundedCornerShape(10.dp)
        )

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(filtered) { item ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(item.varietyName, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("હાજર આખી બોરી:", fontSize = 12.sp, color = Color.Gray)
                                Text(
                                    "${item.availableBags} બોરી",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (item.availableBags <= 15) RedDanger else GreenPrimary
                                )
                            }

                            Column {
                                Text("છૂટક કિલો:", fontSize = 12.sp, color = Color.Gray)
                                Text("${item.availableLooseKg} kg", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text("કુલ નેટ વજન:", fontSize = 12.sp, color = Color.Gray)
                                Text("${item.totalWeightKg} kg", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = GreenDark)
                            }
                        }

                        if (item.availableBags <= 15) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = AmberAccent, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("સ્ટોક ઓછો છે - નવો ઓર્ડર આપવો જરૂરી", fontSize = 11.sp, color = AmberAccent)
                            }
                        }
                    }
                }
            }
        }
    }
}
