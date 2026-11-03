package com.example.krushitrade.util

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import android.widget.Toast
import androidx.core.content.FileProvider
import com.example.krushitrade.model.PurchaseRecord
import com.example.krushitrade.model.SaleInvoice
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.Locale

object InvoicePdfHelper {

    // Helper adapter to pipe a PDF file directly to Android PrintManager
    class PdfFilePrintDocumentAdapter(private val file: File) : PrintDocumentAdapter() {
        override fun onLayout(
            oldAttributes: PrintAttributes?,
            newAttributes: PrintAttributes?,
            cancellationSignal: CancellationSignal?,
            callback: LayoutResultCallback?,
            extras: Bundle?
        ) {
            if (cancellationSignal?.isCanceled == true) {
                callback?.onLayoutCancelled()
                return
            }
            val pdi = PrintDocumentInfo.Builder(file.name)
                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                .setPageCount(1)
                .build()
            callback?.onLayoutFinished(pdi, true)
        }

        override fun onWrite(
            pages: Array<out PageRange>?,
            destination: ParcelFileDescriptor?,
            cancellationSignal: CancellationSignal?,
            callback: WriteResultCallback?
        ) {
            try {
                FileInputStream(file).use { input ->
                    FileOutputStream(destination?.fileDescriptor).use { output ->
                        input.copyTo(output)
                    }
                }
                callback?.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
            } catch (e: Exception) {
                callback?.onWriteFailed(e.message)
            }
        }
    }

    /**
     * Generates a standard A4 PDF invoice document for a sale.
     */
    fun generateSaleInvoicePdf(context: Context, sale: SaleInvoice): File {
        val invoicesDir = File(context.cacheDir, "invoices")
        if (!invoicesDir.exists()) invoicesDir.mkdirs()
        val file = File(invoicesDir, "Invoice_${sale.billNo}.pdf")

        val document = PdfDocument()
        val pageWidth = 595
        val pageHeight = 842
        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = document.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
        }

        // Background White
        canvas.drawColor(Color.WHITE)

        // Outer Page Border
        strokePaint.color = Color.rgb(203, 213, 225) // Slate-300
        strokePaint.strokeWidth = 1.5f
        canvas.drawRect(24f, 24f, (pageWidth - 24).toFloat(), (pageHeight - 24).toFloat(), strokePaint)

        // Header Background Banner
        paint.color = Color.rgb(6, 78, 59) // Deep Green (#064E3B)
        paint.style = Paint.Style.FILL
        canvas.drawRect(24f, 24f, (pageWidth - 24).toFloat(), 110f, paint)

        // Header Texts
        paint.color = Color.WHITE
        paint.textSize = 20f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("🌱 કૃષિ ટ્રેડ (KRUSHI TRADE)", (pageWidth / 2).toFloat(), 55f, paint)

        paint.textSize = 10.5f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("શ્રી નંદિની સીડ્સ • ઉત્તમ ગુણવત્તાવાળા બિયારણના વિક્રેતા (હોલસેલ & રીટેઈલ)", (pageWidth / 2).toFloat(), 74f, paint)

        paint.textSize = 9.5f
        paint.color = Color.rgb(209, 250, 229)
        canvas.drawText("સ્ટેશન રોડ, માર્કેટ યાર્ડ પાસે, જૂનાગઢ (ગુજરાત) | મો. ૯૮૨૫૦ ૦૦૦૦૦", (pageWidth / 2).toFloat(), 92f, paint)

        // Invoice Sub-Banner Badge
        paint.color = Color.rgb(236, 253, 245)
        val badgeRect = RectF(150f, 118f, (pageWidth - 150).toFloat(), 138f)
        canvas.drawRoundRect(badgeRect, 8f, 8f, paint)
        strokePaint.color = Color.rgb(167, 243, 208)
        strokePaint.strokeWidth = 1f
        canvas.drawRoundRect(badgeRect, 8f, 8f, strokePaint)

        paint.color = Color.rgb(5, 150, 105)
        paint.textSize = 10f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("સાદું વેચાણ બિલ (CASH / CREDIT MEMO) • ભાવ પ્રતિ ૨૦ KG (મણ)", (pageWidth / 2).toFloat(), 132f, paint)

        // Customer & Bill Info Box
        val infoTop = 148f
        val infoBottom = 215f
        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRect(36f, infoTop, (pageWidth - 36).toFloat(), infoBottom, paint)
        strokePaint.color = Color.rgb(226, 232, 240)
        canvas.drawRect(36f, infoTop, (pageWidth - 36).toFloat(), infoBottom, strokePaint)

        // Left info column
        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.rgb(71, 85, 105)
        paint.textSize = 10f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("બિલ નં:", 46f, 168f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(sale.billNo, 95f, 168f, paint)

        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("તારીખ:", 46f, 186f, paint)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(if (sale.billDate.isNotEmpty()) sale.billDate else "—", 95f, 186f, paint)

        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("પ્રકાર:", 46f, 204f, paint)
        paint.color = if (sale.dueAmount > 0) Color.rgb(220, 38, 38) else Color.rgb(22, 101, 52)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        val modeStr = if (sale.dueAmount <= 0) "રોકડ (Cash)" else (if (sale.paidAmount > 0) "અંશતઃ રોકડ + બાકી" else "ઉધાર (Udhar)")
        canvas.drawText(modeStr, 95f, 204f, paint)

        // Right info column (Customer)
        val rightX = 310f
        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("ખેડૂત/ગ્રાહક:", rightX, 168f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(sale.farmerName, rightX + 65f, 168f, paint)

        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("ગામ:", rightX, 186f, paint)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(if (sale.farmerVillage.isNotEmpty()) sale.farmerVillage else "—", rightX + 65f, 186f, paint)

        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("મોબાઇલ:", rightX, 204f, paint)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(if (sale.farmerMobile.isNotEmpty()) sale.farmerMobile else "—", rightX + 65f, 204f, paint)

        // Table Header
        val tblTop = 226f
        val tblHeight = 24f
        paint.color = Color.rgb(15, 118, 110) // Dark Teal
        canvas.drawRect(36f, tblTop, (pageWidth - 36).toFloat(), tblTop + tblHeight, paint)

        paint.color = Color.WHITE
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)

        canvas.drawText("ક્રમ", 46f, tblTop + 16f, paint)
        canvas.drawText("બિયારણ વિગત", 80f, tblTop + 16f, paint)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("બોરી", 260f, tblTop + 16f, paint)
        canvas.drawText("કુલ KG", 320f, tblTop + 16f, paint)
        canvas.drawText("મણ (૨૦ KG)", 385f, tblTop + 16f, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("ભાવ (₹/૨૦ KG)", 480f, tblTop + 16f, paint)
        canvas.drawText("રકમ (₹)", (pageWidth - 46).toFloat(), tblTop + 16f, paint)

        // Table Rows
        var currentY = tblTop + tblHeight
        sale.items.forEachIndexed { idx, it ->
            val rowHeight = 32f
            paint.color = if (idx % 2 == 0) Color.rgb(255, 255, 255) else Color.rgb(248, 250, 252)
            canvas.drawRect(36f, currentY, (pageWidth - 36).toFloat(), currentY + rowHeight, paint)

            strokePaint.color = Color.rgb(226, 232, 240)
            strokePaint.strokeWidth = 0.8f
            canvas.drawLine(36f, currentY + rowHeight, (pageWidth - 36).toFloat(), currentY + rowHeight, strokePaint)

            paint.color = Color.rgb(15, 23, 42)
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.LEFT
            paint.textSize = 10f
            canvas.drawText("${idx + 1}", 48f, currentY + 18f, paint)

            // Variety & breakdown
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText(it.varietyName, 80f, currentY + 14f, paint)

            paint.typeface = Typeface.DEFAULT
            paint.textSize = 8f
            paint.color = Color.rgb(100, 116, 139)
            val breakdown = if (it.bags2 > 0) "${it.bags1}×${it.kg1.toInt()}kg + ${it.bags2}×${it.kg2.toInt()}kg" else "${it.bags1}×${it.kg1.toInt()}kg"
            canvas.drawText("($breakdown)", 80f, currentY + 26f, paint)

            paint.textSize = 10f
            paint.color = Color.rgb(15, 23, 42)
            paint.textAlign = Paint.Align.CENTER
            canvas.drawText("${it.bags}", 260f, currentY + 18f, paint)

            val totalKg = if (it.totalWeightKg > 0) it.totalWeightKg else (it.bags * 35.0)
            val totalMan = totalKg / 20.0
            canvas.drawText("${String.format(Locale.US, "%.1f", totalKg)} kg", 320f, currentY + 18f, paint)

            paint.color = Color.rgb(5, 150, 105)
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("${String.format(Locale.US, "%.2f", totalMan)} મણ", 385f, currentY + 18f, paint)

            paint.textAlign = Paint.Align.RIGHT
            paint.color = Color.rgb(15, 23, 42)
            paint.typeface = Typeface.DEFAULT
            canvas.drawText("₹${String.format(Locale.US, "%.2f", it.rate)}", 480f, currentY + 18f, paint)

            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("₹${String.format(Locale.US, "%.0f", it.itemTotal)}", (pageWidth - 46).toFloat(), currentY + 18f, paint)

            currentY += rowHeight
        }

        // Summary Breakdown Box (Bottom Right)
        val sumBoxTop = currentY + 16f
        val sumBoxLeft = 320f
        val sumBoxRight = (pageWidth - 36).toFloat()

        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRect(sumBoxLeft, sumBoxTop, sumBoxRight, sumBoxTop + 140f, paint)
        strokePaint.color = Color.rgb(226, 232, 240)
        canvas.drawRect(sumBoxLeft, sumBoxTop, sumBoxRight, sumBoxTop + 140f, strokePaint)

        var sumY = sumBoxTop + 18f
        paint.textSize = 9.5f
        paint.typeface = Typeface.DEFAULT

        // Subtotal
        paint.color = Color.rgb(71, 85, 105)
        paint.textAlign = Paint.Align.LEFT
        canvas.drawText("બિયારણ રકમ (Sub Total):", sumBoxLeft + 12f, sumY, paint)
        paint.textAlign = Paint.Align.RIGHT
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText("₹${String.format(Locale.US, "%.0f", sale.subTotal)}", sumBoxRight - 12f, sumY, paint)
        sumY += 16f

        // Majuri
        if (sale.majuriAmount > 0) {
            paint.textAlign = Paint.Align.LEFT
            paint.color = Color.rgb(30, 64, 175)
            canvas.drawText("+ મજૂરી ખર્ચ:", sumBoxLeft + 12f, sumY, paint)
            paint.textAlign = Paint.Align.RIGHT
            canvas.drawText("+ ₹${String.format(Locale.US, "%.0f", sale.majuriAmount)}", sumBoxRight - 12f, sumY, paint)
            sumY += 16f
        }

        // Extra
        if (sale.extraCharges > 0) {
            paint.textAlign = Paint.Align.LEFT
            paint.color = Color.rgb(30, 64, 175)
            canvas.drawText("+ અન્ય ચાર્જ:", sumBoxLeft + 12f, sumY, paint)
            paint.textAlign = Paint.Align.RIGHT
            canvas.drawText("+ ₹${String.format(Locale.US, "%.0f", sale.extraCharges)}", sumBoxRight - 12f, sumY, paint)
            sumY += 16f
        }

        // Discount
        if (sale.discount > 0) {
            paint.textAlign = Paint.Align.LEFT
            paint.color = Color.rgb(220, 38, 38)
            canvas.drawText("- ડિસ્કાઉન્ટ:", sumBoxLeft + 12f, sumY, paint)
            paint.textAlign = Paint.Align.RIGHT
            canvas.drawText("- ₹${String.format(Locale.US, "%.0f", sale.discount)}", sumBoxRight - 12f, sumY, paint)
            sumY += 16f
        }

        // Divider
        strokePaint.color = Color.rgb(203, 213, 225)
        canvas.drawLine(sumBoxLeft + 12f, sumY - 4f, sumBoxRight - 12f, sumY - 4f, strokePaint)

        // Net Amount
        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.rgb(6, 78, 59)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 11f
        canvas.drawText("કુલ ચૂકવવાપાત્ર:", sumBoxLeft + 12f, sumY + 8f, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("₹${String.format(Locale.US, "%.0f", sale.netAmount)}", sumBoxRight - 12f, sumY + 8f, paint)
        sumY += 22f

        // Paid
        paint.textSize = 9.5f
        paint.typeface = Typeface.DEFAULT
        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.rgb(22, 101, 52)
        canvas.drawText("જમા રોકડ / UPI:", sumBoxLeft + 12f, sumY, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("₹${String.format(Locale.US, "%.0f", sale.paidAmount)}", sumBoxRight - 12f, sumY, paint)
        sumY += 18f

        // Due
        paint.textAlign = Paint.Align.LEFT
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = if (sale.dueAmount > 0) Color.rgb(220, 38, 38) else Color.rgb(22, 101, 52)
        canvas.drawText(if (sale.dueAmount > 0) "બાકી રકમ (ઉધાર):" else "હિસાબ પૂરો (Paid):", sumBoxLeft + 12f, sumY, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("₹${String.format(Locale.US, "%.0f", sale.dueAmount)}", sumBoxRight - 12f, sumY, paint)

        // Terms and Signature at Bottom
        val footerY = (pageHeight - 90).toFloat()
        strokePaint.color = Color.rgb(203, 213, 225)
        strokePaint.strokeWidth = 1f
        canvas.drawLine(36f, footerY, (pageWidth - 36).toFloat(), footerY, strokePaint)

        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 8.5f
        paint.color = Color.rgb(100, 116, 139)
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("• વેચેલો માલ પરત લેવામાં આવશે નહીં.", 36f, footerY + 18f, paint)
        canvas.drawText("• ઉગાવાની સંપૂર્ણ ખાતરી કંપનીની ગેરંટી મુજબ રહેશે.", 36f, footerY + 32f, paint)
        canvas.drawText("• કોઈપણ વિવાદ માટે ન્યાયક્ષેત્ર જૂનાગઢ રહેશે.", 36f, footerY + 46f, paint)

        // Signature line
        val sigLineRight = (pageWidth - 46).toFloat()
        val sigLineLeft = sigLineRight - 120f
        canvas.drawLine(sigLineLeft, footerY + 45f, sigLineRight, footerY + 45f, strokePaint)
        paint.textAlign = Paint.Align.CENTER
        paint.color = Color.rgb(51, 65, 85)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 9f
        canvas.drawText("કૃષિ ટ્રેડ સહી / સિક્કો", (sigLineLeft + sigLineRight) / 2, footerY + 58f, paint)

        document.finishPage(page)

        FileOutputStream(file).use { out ->
            document.writeTo(out)
        }
        document.close()

        return file
    }

    /**
     * Prints the Sale Invoice using Android's native PrintManager.
     * This opens the system print dialog where user can select physical printer or Save as PDF.
     */
    fun printSaleInvoice(context: Context, sale: SaleInvoice) {
        try {
            val pdfFile = generateSaleInvoicePdf(context, sale)
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager
            if (printManager != null) {
                printManager.print(
                    "Invoice_${sale.billNo}",
                    PdfFilePrintDocumentAdapter(pdfFile),
                    PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build()
                )
            } else {
                shareSaleInvoicePdf(context, sale)
            }
        } catch (e: Exception) {
            Toast.makeText(context, "પ્રિન્ટ કરવામાં ભૂલ આવી: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Shares the generated Invoice PDF directly to WhatsApp or Android share sheet as an actual PDF document attachment.
     */
    fun shareSaleInvoicePdf(context: Context, sale: SaleInvoice) {
        try {
            val pdfFile = generateSaleInvoicePdf(context, sale)
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                pdfFile
            )

            val summaryText = "🌱 *કૃષિ ટ્રેડ (KRUSHI TRADE) - વેચાણ બિલ*\n" +
                    "------------------------------------\n" +
                    "બિલ નં: ${sale.billNo}\n" +
                    "તારીખ: ${sale.billDate}\n" +
                    "ખેડૂત: ${sale.farmerName} ${if (sale.farmerVillage.isNotEmpty()) "(${sale.farmerVillage})" else ""}\n" +
                    "કુલ બોરી: ${sale.items.sumOf { it.bags }}\n" +
                    "કુલ વજન: ${sale.items.sumOf { it.totalWeightKg }} KG (${String.format(Locale.US, "%.2f", sale.items.sumOf { it.totalWeightKg } / 20.0)} મણ)\n" +
                    "*કુલ રકમ: ₹${sale.netAmount.toInt()}*\n" +
                    "ચુકવેલ: ₹${sale.paidAmount.toInt()}\n" +
                    (if (sale.dueAmount > 0) "*બાકી ઉધાર: ₹${sale.dueAmount.toInt()}*\n" else "") +
                    "------------------------------------\n" +
                    "સાથે પાકું ઇન્વોઇસ PDF મોકલેલ છે. આભાર! 🙏"

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_TEXT, summaryText)
                putExtra(Intent.EXTRA_SUBJECT, "બિલ નં: ${sale.billNo} - કૃષિ ટ્રેડ")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            // Target WhatsApp specifically if installed, else open system chooser
            val waIntent = Intent(shareIntent).apply {
                setPackage("com.whatsapp")
            }

            try {
                context.startActivity(waIntent)
            } catch (e1: Exception) {
                // Try WhatsApp Business
                try {
                    val waBIntent = Intent(shareIntent).apply {
                        setPackage("com.whatsapp.w4b")
                    }
                    context.startActivity(waBIntent)
                } catch (e2: Exception) {
                    val chooser = Intent.createChooser(shareIntent, "📄 વેચાણ ઇન્વોઇસ PDF શેર કરો")
                    context.startActivity(chooser)
                }
            }
        } catch (e: Exception) {
            Toast.makeText(context, "ઇન્વોઇસ શેર કરવામાં ભૂલ: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Generates a standard A4 PDF voucher document for a purchase.
     */
    fun generatePurchaseVoucherPdf(context: Context, pur: PurchaseRecord): File {
        val invoicesDir = File(context.cacheDir, "invoices")
        if (!invoicesDir.exists()) invoicesDir.mkdirs()
        val file = File(invoicesDir, "Purchase_${pur.billNo}.pdf")

        val document = PdfDocument()
        val pageWidth = 595
        val pageHeight = 842
        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = document.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
        }

        canvas.drawColor(Color.WHITE)

        // Outer Border
        strokePaint.color = Color.rgb(203, 213, 225)
        strokePaint.strokeWidth = 1.5f
        canvas.drawRect(24f, 24f, (pageWidth - 24).toFloat(), (pageHeight - 24).toFloat(), strokePaint)

        // Header Banner
        paint.color = Color.rgb(20, 83, 45) // Emerald-900
        paint.style = Paint.Style.FILL
        canvas.drawRect(24f, 24f, (pageWidth - 24).toFloat(), 110f, paint)

        paint.color = Color.WHITE
        paint.textSize = 20f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("🌱 કૃષિ ટ્રેડ (KRUSHI TRADE)", (pageWidth / 2).toFloat(), 55f, paint)

        paint.textSize = 10.5f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("શ્રી નંદિની સીડ્સ • ખરીદી વાઉચર (PURCHASE VOUCHER)", (pageWidth / 2).toFloat(), 74f, paint)

        paint.textSize = 9.5f
        paint.color = Color.rgb(209, 250, 229)
        canvas.drawText("સ્ટેશન રોડ, માર્કેટ યાર્ડ પાસે, જૂનાગઢ (ગુજરાત) | મો. ૯૮૨૫૦ ૦૦૦૦૦", (pageWidth / 2).toFloat(), 92f, paint)

        // Metadata box
        val infoTop = 130f
        val infoBottom = 200f
        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRect(36f, infoTop, (pageWidth - 36).toFloat(), infoBottom, paint)
        strokePaint.color = Color.rgb(226, 232, 240)
        canvas.drawRect(36f, infoTop, (pageWidth - 36).toFloat(), infoBottom, strokePaint)

        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.rgb(71, 85, 105)
        paint.textSize = 10f
        canvas.drawText("વાઉચર નં:", 46f, 155f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(pur.billNo, 105f, 155f, paint)

        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("તારીખ:", 46f, 175f, paint)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(pur.purchaseDate, 105f, 175f, paint)

        if (pur.truckNo.isNotEmpty()) {
            paint.typeface = Typeface.DEFAULT
            paint.color = Color.rgb(71, 85, 105)
            canvas.drawText("ગાડી નં:", 46f, 192f, paint)
            paint.color = Color.rgb(15, 23, 42)
            canvas.drawText("${pur.truckNo} ${if (pur.truckOwner.isNotEmpty()) "(${pur.truckOwner})" else ""}", 105f, 192f, paint)
        }

        // Right column
        val rightX = 310f
        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("પાર્ટી/માલિક:", rightX, 155f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(pur.partyName, rightX + 70f, 155f, paint)

        paint.typeface = Typeface.DEFAULT
        paint.color = Color.rgb(71, 85, 105)
        canvas.drawText("ગામ:", rightX, 175f, paint)
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText(if (pur.village.isNotEmpty()) pur.village else "—", rightX + 70f, 175f, paint)

        // Table Header
        val tblTop = 215f
        val tblHeight = 24f
        paint.color = Color.rgb(20, 83, 45)
        canvas.drawRect(36f, tblTop, (pageWidth - 36).toFloat(), tblTop + tblHeight, paint)

        paint.color = Color.WHITE
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.LEFT
        canvas.drawText("ક્રમ", 46f, tblTop + 16f, paint)
        canvas.drawText("બિયારણ જાત (Variety)", 80f, tblTop + 16f, paint)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("બોરી", 260f, tblTop + 16f, paint)
        canvas.drawText("કુલ KG", 320f, tblTop + 16f, paint)
        canvas.drawText("મણ (૨૦ KG)", 385f, tblTop + 16f, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("ભાવ (₹/મણ)", 480f, tblTop + 16f, paint)
        canvas.drawText("રકમ (₹)", (pageWidth - 46).toFloat(), tblTop + 16f, paint)

        // Table Rows
        var currentY = tblTop + tblHeight
        pur.items.forEachIndexed { idx, it ->
            val rowHeight = 32f
            paint.color = if (idx % 2 == 0) Color.rgb(255, 255, 255) else Color.rgb(248, 250, 252)
            canvas.drawRect(36f, currentY, (pageWidth - 36).toFloat(), currentY + rowHeight, paint)

            strokePaint.color = Color.rgb(226, 232, 240)
            strokePaint.strokeWidth = 0.8f
            canvas.drawLine(36f, currentY + rowHeight, (pageWidth - 36).toFloat(), currentY + rowHeight, strokePaint)

            paint.color = Color.rgb(15, 23, 42)
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.LEFT
            paint.textSize = 10f
            canvas.drawText("${idx + 1}", 48f, currentY + 18f, paint)

            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText(it.varietyName, 80f, currentY + 14f, paint)

            paint.typeface = Typeface.DEFAULT
            paint.textSize = 8f
            paint.color = Color.rgb(100, 116, 139)
            val breakdown = if (it.bags2 > 0) "${it.bags1}×${it.kg1.toInt()}kg + ${it.bags2}×${it.kg2.toInt()}kg" else "${it.bags1}×${it.kg1.toInt()}kg"
            canvas.drawText("($breakdown)", 80f, currentY + 26f, paint)

            paint.textSize = 10f
            paint.color = Color.rgb(15, 23, 42)
            paint.textAlign = Paint.Align.CENTER
            canvas.drawText("${it.bags}", 260f, currentY + 18f, paint)
            canvas.drawText("${String.format(Locale.US, "%.1f", it.netWeightKg)} kg", 320f, currentY + 18f, paint)

            paint.color = Color.rgb(5, 150, 105)
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("${String.format(Locale.US, "%.2f", it.totalMan)} મણ", 385f, currentY + 18f, paint)

            paint.textAlign = Paint.Align.RIGHT
            paint.color = Color.rgb(15, 23, 42)
            paint.typeface = Typeface.DEFAULT
            canvas.drawText("₹${String.format(Locale.US, "%.2f", it.ratePerMan)}", 480f, currentY + 18f, paint)

            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("₹${String.format(Locale.US, "%.0f", it.itemTotal)}", (pageWidth - 46).toFloat(), currentY + 18f, paint)

            currentY += rowHeight
        }

        // Summary Box
        val sumBoxTop = currentY + 16f
        val sumBoxLeft = 320f
        val sumBoxRight = (pageWidth - 36).toFloat()

        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRect(sumBoxLeft, sumBoxTop, sumBoxRight, sumBoxTop + 110f, paint)
        strokePaint.color = Color.rgb(226, 232, 240)
        canvas.drawRect(sumBoxLeft, sumBoxTop, sumBoxRight, sumBoxTop + 110f, strokePaint)

        var sumY = sumBoxTop + 18f
        paint.textSize = 9.5f
        paint.typeface = Typeface.DEFAULT

        paint.color = Color.rgb(71, 85, 105)
        paint.textAlign = Paint.Align.LEFT
        canvas.drawText("માલ રકમ (Sub Total):", sumBoxLeft + 12f, sumY, paint)
        paint.textAlign = Paint.Align.RIGHT
        paint.color = Color.rgb(15, 23, 42)
        canvas.drawText("₹${String.format(Locale.US, "%.0f", pur.itemsSubTotal)}", sumBoxRight - 12f, sumY, paint)
        sumY += 16f

        if (pur.totalExpenses > 0) {
            paint.textAlign = Paint.Align.LEFT
            paint.color = Color.rgb(30, 64, 175)
            canvas.drawText("+ ખર્ચ / મજૂરી:", sumBoxLeft + 12f, sumY, paint)
            paint.textAlign = Paint.Align.RIGHT
            canvas.drawText("+ ₹${String.format(Locale.US, "%.0f", pur.totalExpenses)}", sumBoxRight - 12f, sumY, paint)
            sumY += 16f
        }

        // Net Amount
        strokePaint.color = Color.rgb(203, 213, 225)
        canvas.drawLine(sumBoxLeft + 12f, sumY - 2f, sumBoxRight - 12f, sumY - 2f, strokePaint)

        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.rgb(20, 83, 45)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 11f
        canvas.drawText("ચુકવવાપાત્ર કુલ:", sumBoxLeft + 12f, sumY + 12f, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("₹${String.format(Locale.US, "%.0f", pur.netTotal)}", sumBoxRight - 12f, sumY + 12f, paint)
        sumY += 26f

        // Paid & Due
        paint.textSize = 9.5f
        paint.typeface = Typeface.DEFAULT
        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.rgb(22, 101, 52)
        canvas.drawText("ચુકવેલ રકમ:", sumBoxLeft + 12f, sumY, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("₹${String.format(Locale.US, "%.0f", pur.paidAmount)}", sumBoxRight - 12f, sumY, paint)
        sumY += 16f

        paint.textAlign = Paint.Align.LEFT
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = if (pur.dueAmount > 0) Color.rgb(220, 38, 38) else Color.rgb(22, 101, 52)
        canvas.drawText("બાકી રકમ:", sumBoxLeft + 12f, sumY, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("₹${String.format(Locale.US, "%.0f", pur.dueAmount)}", sumBoxRight - 12f, sumY, paint)

        // Footer
        val footerY = (pageHeight - 80).toFloat()
        strokePaint.color = Color.rgb(203, 213, 225)
        strokePaint.strokeWidth = 1f
        canvas.drawLine(36f, footerY, (pageWidth - 36).toFloat(), footerY, strokePaint)

        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 8.5f
        paint.color = Color.rgb(100, 116, 139)
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("શ્રી નંદિની સીડ્સ | કૃષિ ટ્રેડ મેનેજમેન્ટ સિસ્ટમ", 36f, footerY + 20f, paint)

        val sigLineRight = (pageWidth - 46).toFloat()
        val sigLineLeft = sigLineRight - 120f
        canvas.drawLine(sigLineLeft, footerY + 35f, sigLineRight, footerY + 35f, strokePaint)
        paint.textAlign = Paint.Align.CENTER
        paint.color = Color.rgb(51, 65, 85)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 9f
        canvas.drawText("કૃષિ ટ્રેડ સહી/સિક્કો", (sigLineLeft + sigLineRight) / 2, footerY + 48f, paint)

        document.finishPage(page)

        FileOutputStream(file).use { out ->
            document.writeTo(out)
        }
        document.close()

        return file
    }

    fun printPurchaseVoucher(context: Context, pur: PurchaseRecord) {
        try {
            val pdfFile = generatePurchaseVoucherPdf(context, pur)
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager
            if (printManager != null) {
                printManager.print(
                    "Purchase_${pur.billNo}",
                    PdfFilePrintDocumentAdapter(pdfFile),
                    PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build()
                )
            } else {
                sharePurchaseVoucherPdf(context, pur)
            }
        } catch (e: Exception) {
            Toast.makeText(context, "પ્રિન્ટ કરવામાં ભૂલ આવી: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun sharePurchaseVoucherPdf(context: Context, pur: PurchaseRecord) {
        try {
            val pdfFile = generatePurchaseVoucherPdf(context, pur)
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                pdfFile
            )

            val summaryText = "🧾 *શ્રી નંદિની સીડ્સ - ખરીદી વાઉચર*\n" +
                    "------------------------------------\n" +
                    "બિલ નં: ${pur.billNo}\n" +
                    "તારીખ: ${pur.purchaseDate}\n" +
                    "પાર્ટી: ${pur.partyName} ${if (pur.village.isNotEmpty()) "(${pur.village})" else ""}\n" +
                    "કુલ બોરી: ${pur.items.sumOf { it.bags }}\n" +
                    "કુલ વજન: ${pur.items.sumOf { it.netWeightKg }} KG (${pur.items.sumOf { it.totalMan }} મણ)\n" +
                    "*ચુકવવાપાત્ર કુલ: ₹${pur.netTotal}*\n" +
                    "ચુકવેલ: ₹${pur.paidAmount}\n" +
                    (if (pur.dueAmount > 0) "*બાકી: ₹${pur.dueAmount}*\n" else "") +
                    "------------------------------------\n" +
                    "સાથે ખરીદી વાઉચર PDF જોડાયેલ છે. 🙏"

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_TEXT, summaryText)
                putExtra(Intent.EXTRA_SUBJECT, "ખરીદી વાઉચર નં: ${pur.billNo}")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val waIntent = Intent(shareIntent).apply {
                setPackage("com.whatsapp")
            }

            try {
                context.startActivity(waIntent)
            } catch (e1: Exception) {
                try {
                    val waBIntent = Intent(shareIntent).apply {
                        setPackage("com.whatsapp.w4b")
                    }
                    context.startActivity(waBIntent)
                } catch (e2: Exception) {
                    val chooser = Intent.createChooser(shareIntent, "📄 ખરીદી વાઉચર PDF શેર કરો")
                    context.startActivity(chooser)
                }
            }
        } catch (e: Exception) {
            Toast.makeText(context, "વાઉચર શેર કરવામાં ભૂલ: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}
