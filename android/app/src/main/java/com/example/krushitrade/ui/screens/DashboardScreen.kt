package com.example.krushitrade.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.krushitrade.model.SaleInvoice
import com.example.krushitrade.model.StockItem
import com.example.krushitrade.ui.theme.*

@Composable
fun DashboardScreen(
    sales: List<SaleInvoice>,
    stock: List<StockItem>,
    onNavigateToSales: () -> Unit,
    onNavigateToStock: () -> Unit
) {
    val totalTodaySales = sales.sumOf { it.netAmount }
    val totalBags = stock.sumOf { it.availableBags }
    val totalKg = stock.sumOf { it.totalWeightKg }
    val totalUdhar = sales.sumOf { it.dueAmount }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgLight)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // App Title Banner
        Text(
            text = "🌱 કૃષિ ટ્રેડ ડેશબોર્ડ",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = GreenDark
        )
        Text(
            text = "બિયારણ ખરીદ, વેચાણ & સ્ટોક વ્યવસ્થાપન",
            fontSize = 13.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // 4 KPI Cards
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard(
                modifier = Modifier.weight(1f),
                title = "આજનું વેચાણ",
                value = "₹${totalTodaySales.toInt()}",
                subtitle = "${sales.size} બિલો",
                icon = Icons.Default.TrendingUp,
                color = GreenPrimary
            )
            KpiCard(
                modifier = Modifier.weight(1f),
                title = "હાજર બોરી",
                value = "$totalBags",
                subtitle = "આખી બોરી",
                icon = Icons.Default.AllInbox,
                color = Color(0xFF2563EB)
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard(
                modifier = Modifier.weight(1f),
                title = "કુલ વજન",
                value = "${totalKg.toInt()} kg",
                subtitle = "બોરી + છૂટક",
                icon = Icons.Default.Scale,
                color = Color(0xFF7C3AED)
            )
            KpiCard(
                modifier = Modifier.weight(1f),
                title = "બાકી ઉધાર",
                value = "₹${totalUdhar.toInt()}",
                subtitle = "લેણી રકમ",
                icon = Icons.Default.People,
                color = RedDanger
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Quick Actions
        Text(
            text = "ઝડપી ક્રિયાઓ (Quick Actions)",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF0F172A),
            modifier = Modifier.padding(bottom = 10.dp)
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(
                onClick = onNavigateToSales,
                colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.weight(1f).height(50.dp)
            ) {
                Icon(Icons.Default.Receipt, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("નવું બિલ", fontWeight = FontWeight.SemiBold)
            }

            OutlinedButton(
                onClick = onNavigateToStock,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.weight(1f).height(50.dp)
            ) {
                Icon(Icons.Default.Inventory2, contentDescription = null, tint = GreenPrimary)
                Spacer(modifier = Modifier.width(6.dp))
                Text("સ્ટોક જુઓ", color = GreenPrimary, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Recent Invoices Section
        Text(
            text = "તાજેતરના સાદા બિલો (Recent Bills)",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF0F172A),
            modifier = Modifier.padding(bottom = 10.dp)
        )

        if (sales.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite)
            ) {
                Text(
                    text = "હજુ કોઈ બિલ બનેલ નથી. 'નવું બિલ' પર ક્લિક કરી શરૂ કરો.",
                    color = Color.Gray,
                    modifier = Modifier.padding(20.dp)
                )
            }
        } else {
            sales.take(4).forEach { sale ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    shape = RoundedCornerShape(10.dp),
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
                            Text(sale.billNo, fontWeight = FontWeight.Bold, color = GreenDark)
                            Text(sale.farmerName, fontSize = 13.sp, color = Color(0xFF334155))
                            Text(
                                "${sale.items.sumOf { it.bags }} બોરી (${sale.items.sumOf { it.totalWeightKg }} kg)",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("₹${sale.netAmount.toInt()}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = GreenPrimary)
                            if (sale.dueAmount > 0) {
                                Text("બાકી: ₹${sale.dueAmount.toInt()}", fontSize = 12.sp, color = RedDanger, fontWeight = FontWeight.SemiBold)
                            } else {
                                Text("જમા", fontSize = 12.sp, color = GreenPrimary)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KpiCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    color: Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color.copy(alpha = 0.12f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text(title, fontSize = 12.sp, color = Color(0xFF64748B))
            Text(subtitle, fontSize = 10.sp, color = color, fontWeight = FontWeight.SemiBold)
        }
    }
}
