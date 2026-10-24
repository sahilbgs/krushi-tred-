package com.example.krushitrade.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val GreenPrimary = Color(0xFF059669)
val GreenDark = Color(0xFF064E3B)
val GreenLight = Color(0xFFECFDF5)
val AmberAccent = Color(0xFFD97706)
val RedDanger = Color(0xFFDC2626)
val BgLight = Color(0xFFF8FAFC)
val SurfaceWhite = Color(0xFFFFFFFF)

private val LightColorScheme = lightColorScheme(
    primary = GreenPrimary,
    onPrimary = Color.White,
    secondary = AmberAccent,
    background = BgLight,
    surface = SurfaceWhite,
    onSurface = Color(0xFF0F172A),
    error = RedDanger
)

@Composable
fun KrushiTradeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
