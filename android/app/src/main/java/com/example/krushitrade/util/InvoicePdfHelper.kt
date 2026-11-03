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

    fun numberToGujaratiWords(amount: Double): String {
        var n = Math.round(amount)
        if (n <= 0) return "શૂન્ય રૂપિયા પુરાં માત્ર."

        val ones = arrayOf(
            "", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ",
            "દસ", "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ",
            "વીસ", "એકવીસ", "બાવીસ", "ત્રેવીસ", "ચોવીસ", "પચ્ચીસ", "છવ્વીસ", "सत्ताવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ",
            "ત્રીસ", "એકત્રીસ", "બત્રીસ", "તેત્રીસ", "ચોત્રીસ", "પાંત્રીસ", "છત્રીસ", "સાડત્રીસ", "આડત્રીસ", "ઓગણચાલીસ",
            "ચાલીસ", "એકતાલીસ", "બેતાલીસ", "તેતાલીસ", "ચુંમાલીસ", "પિસ્તાલીસ", "છેતાલીસ", "સુડતાલીસ", "અડતાલીસ", "ઓગણપચાસ",
            "પચાસ", "એકાવન", "બાવન", "ત્રેપન", "ચોપન", "પંચાવન", "છપ્પન", "સત્તાવન", "અઠ્ઠાવન", "ઓગણસાઠ",
            "સાઠ", "એકસઠ", "બાસઠ", "ત્રેસઠ", "ચોસઠ", "પાંસઠ", "છાસઠ", "સડસઠ", "અડસઠ", "ઓગણોસિત્તેર",
            "સિત્તેર", "એકોતેર", "બોતેર", "તેંતેર", "ચુમોતેર", "પંચોતેર", "છોતેર", "સંતોતેર", "ઇઠોતેર", "ઓગણાએંસી",
            "એસી", "એક્યાસી", "બ્યાસી", "ત્યાંસી", "ચોર્યાસી", "પંચાસી", "છ્યાસી", "સત્યાસી", "અઠ્યાસી", "નેવ્યાસી",
            "નેવું", "એકાણું", "બાણું", "ત્રાણું", "ચોરાણું", "પંચાણું", "છન્નું", "સત્તાણું", "અઠ્ઠાણું", "નવ્વાણું"
        )

        fun convertTwo(num: Long): String {
            return if (num in 1..99) ones[num.toInt()] else ""
        }

        var words = ""

        val crore = n / 10000000
        n %= 10000000

        val lakh = n / 100000
        n %= 100000

        val thousand = n / 1000
        n %= 1000

        val hundred = n / 100
        val rem = n % 100

        if (crore > 0) words += convertTwo(crore) + " કરોડ "
        if (lakh > 0) words += convertTwo(lakh) + " લાખ "
        if (thousand > 0) words += convertTwo(thousand) + " હજાર "
        if (hundred > 0) {
            words += when (hundred) {
                1L -> "એકસો "
                2L -> "બસો "
                3L -> "ત્રણસો "
                else -> convertTwo(hundred) + "સો "
            }
        }
        if (rem > 0) words += convertTwo(rem) + " "

        return words.trim() + " રૂપિયા પુરાં માત્ર."
    }

    private fun formatBillDate(d: String): String {
        if (d.isEmpty()) return "—"
        if (d.contains(".")) return d
        val parts = d.split("-")
        return if (parts.size == 3 && parts[0].length == 4) {
            "${parts[2]}.${parts[1]}.${parts[0]}"
        } else d
    }

    /**
     * Generates a standard A4 PDF invoice document for a sale matching Shree Nandini Seeds layout.
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
        strokePaint.color = Color.BLACK
        strokePaint.strokeWidth = 1.5f
        canvas.drawRect(26f, 26f, (pageWidth - 26).toFloat(), (pageHeight - 26).toFloat(), strokePaint)

        // Header - Brand Left & Gujarati Right
        paint.color = Color.rgb(13, 92, 44) // #0D5C2C
        paint.textSize = 13.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("Shree Nandini", 88f, 56f, paint)

        paint.textSize = 12f
        canvas.drawText("Seeds 🌱", 88f, 72f, paint)

        // Vertical divider
        strokePaint.color = Color.rgb(13, 92, 44)
        strokePaint.strokeWidth = 1.5f
        canvas.drawLine(145f, 42f, 145f, 82f, strokePaint)

        // Right Gujarati Title
        paint.textSize = 24f
        paint.textAlign = Paint.Align.LEFT
        canvas.drawText("શ્રી નંદિની સીડ્સ", 168f, 68f, paint)

        // Bottom green line
        strokePaint.strokeWidth = 2.5f
        canvas.drawLine(26f, 92f, (pageWidth - 26).toFloat(), 92f, strokePaint)

        // Bill No & Date Box (Top Left)
        val noBoxTop = 104f
        val noBoxWidth = 160f
        val noBoxHeight = 44f
        strokePaint.color = Color.BLACK
        strokePaint.strokeWidth = 1.2f
        canvas.drawRect(38f, noBoxTop, 38f + noBoxWidth, noBoxTop + noBoxHeight, strokePaint)
        canvas.drawLine(38f, noBoxTop + 22f, 38f + noBoxWidth, noBoxTop + 22f, strokePaint)

        paint.color = Color.BLACK
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.LEFT
        val cleanBillNo = sale.billNo.replace(Regex("^KT-S-\\d{4}-"), "")
        canvas.drawText("બીલ નં. : $cleanBillNo", 46f, noBoxTop + 15f, paint)
        canvas.drawText("તારીખ : ${formatBillDate(sale.billDate)}", 46f, noBoxTop + 37f, paint)

        // Customer Details Box
        val custTop = 158f
        val custHeight = 66f
        canvas.drawRect(38f, custTop, (pageWidth - 38).toFloat(), custTop + custHeight, strokePaint)
        canvas.drawLine(38f, custTop + 22f, (pageWidth - 38).toFloat(), custTop + 22f, strokePaint)
        canvas.drawLine(38f, custTop + 44f, (pageWidth - 38).toFloat(), custTop + 44f, strokePaint)
        canvas.drawLine((pageWidth / 2).toFloat(), custTop + 44f, (pageWidth / 2).toFloat(), custTop + custHeight, strokePaint)

        canvas.drawText("નામ : ${sale.farmerName}", 46f, custTop + 15f, paint)
        canvas.drawText("ગામ : ${sale.farmerVillage.ifEmpty { "—" }}", 46f, custTop + 37f, paint)
        canvas.drawText("તાલુકો : દિયોદર", 46f, custTop + 59f, paint)
        canvas.drawText("જિલ્લો : વાવ - થરાદ", (pageWidth / 2) + 10f, custTop + 59f, paint)

        // Items Table
        val tblTop = 236f
        val tblHeight = 24f
        val cols = floatArrayOf(38f, 115f, 215f, 280f, 370f, 455f, (pageWidth - 38).toFloat())

        // Header fill
        paint.color = Color.rgb(220, 242, 217) // #dcf2d9
        canvas.drawRect(38f, tblTop, (pageWidth - 38).toFloat(), tblTop + tblHeight, paint)
        canvas.drawRect(38f, tblTop, (pageWidth - 38).toFloat(), tblTop + tblHeight, strokePaint)

        cols.forEach { x ->
            canvas.drawLine(x, tblTop, x, tblTop + tblHeight, strokePaint)
        }

        paint.color = Color.BLACK
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER

        canvas.drawText("પાક", (cols[0] + cols[1]) / 2, tblTop + 16f, paint)
        canvas.drawText("જાત", (cols[1] + cols[2]) / 2, tblTop + 16f, paint)
        canvas.drawText("બેગ (નંગ)", (cols[2] + cols[3]) / 2, tblTop + 16f, paint)
        canvas.drawText("જથ્થો (કિ.ગ્રા.)", (cols[3] + cols[4]) / 2, tblTop + 16f, paint)
        canvas.drawText("દર (રૂ./કિ.ગ્રા.)", (cols[4] + cols[5]) / 2, tblTop + 16f, paint)
        canvas.drawText("રકમ (રૂ.)", (cols[5] + cols[6]) / 2, tblTop + 16f, paint)

        var currentY = tblTop + tblHeight
        val rowHeight = 25f

        sale.items.forEach { it ->
            canvas.drawRect(38f, currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, strokePaint)
            cols.forEach { x ->
                canvas.drawLine(x, currentY, x, currentY + rowHeight, strokePaint)
            }

            paint.color = Color.BLACK
            paint.textAlign = Paint.Align.CENTER
            paint.textSize = 9.5f

            val totalKg = if (it.totalWeightKg > 0) it.totalWeightKg else (it.bags * 35.0)

            canvas.drawText("મગફળી", (cols[0] + cols[1]) / 2, currentY + 17f, paint)
            canvas.drawText(it.varietyName, (cols[1] + cols[2]) / 2, currentY + 17f, paint)
            canvas.drawText("${it.bags}", (cols[2] + cols[3]) / 2, currentY + 17f, paint)
            canvas.drawText("${totalKg.toInt()}", (cols[3] + cols[4]) / 2, currentY + 17f, paint)
            canvas.drawText(String.format(Locale.US, "%,.0f", it.rate), (cols[4] + cols[5]) / 2, currentY + 17f, paint)
            canvas.drawText(String.format(Locale.US, "%,.0f", it.itemTotal), (cols[5] + cols[6]) / 2, currentY + 17f, paint)

            currentY += rowHeight
        }

        // Labour Row (મજૂરી)
        canvas.drawRect(38f, currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, strokePaint)
        cols.forEach { x ->
            canvas.drawLine(x, currentY, x, currentY + rowHeight, strokePaint)
        }
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("મજૂરી", (cols[4] + cols[5]) / 2, currentY + 17f, paint)
        canvas.drawText(String.format(Locale.US, "%,.0f", sale.majuriAmount), (cols[5] + cols[6]) / 2, currentY + 17f, paint)
        currentY += rowHeight

        // Total Amount Row (કુલ રકમ)
        paint.color = Color.rgb(220, 242, 217) // #dcf2d9
        canvas.drawRect(cols[4], currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, paint)
        canvas.drawRect(38f, currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, strokePaint)
        cols.forEach { x ->
            canvas.drawLine(x, currentY, x, currentY + rowHeight, strokePaint)
        }
        paint.color = Color.BLACK
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("કુલ રકમ", (cols[4] + cols[5]) / 2, currentY + 17f, paint)
        canvas.drawText(String.format(Locale.US, "%,.0f", sale.netAmount), (cols[5] + cols[6]) / 2, currentY + 17f, paint)
        currentY += rowHeight

        // Amount in Words Box
        val wordsTop = currentY + 16f
        val wordsHeight = 48f
        paint.color = Color.rgb(220, 242, 217)
        canvas.drawRect(38f, wordsTop, (pageWidth - 38).toFloat(), wordsTop + 22f, paint)
        canvas.drawRect(38f, wordsTop, (pageWidth - 38).toFloat(), wordsTop + wordsHeight, strokePaint)
        canvas.drawLine(38f, wordsTop + 22f, (pageWidth - 38).toFloat(), wordsTop + 22f, strokePaint)

        paint.color = Color.BLACK
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 9.5f
        canvas.drawText("રકમ અક્ષરે (રૂપિયામાં) :", 46f, wordsTop + 15f, paint)
        canvas.drawText(numberToGujaratiWords(sale.netAmount), 46f, wordsTop + 38f, paint)

        // Signatory Box (Bottom Right)
        val sigTop = wordsTop + wordsHeight + 20f
        val sigRight = (pageWidth - 38).toFloat()
        val sigLeft = sigRight - 180f
        val sigHeight = 85f
        canvas.drawRect(sigLeft, sigTop, sigRight, sigTop + sigHeight, strokePaint)

        paint.color = Color.rgb(13, 92, 44)
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = 11f
        canvas.drawText("શ્રી નંદિની સીડ્સ તરફથી,", (sigLeft + sigRight) / 2, sigTop + 24f, paint)

        canvas.drawLine(sigLeft + 25f, sigTop + sigHeight - 25f, sigRight - 25f, sigTop + sigHeight - 25f, strokePaint)

        paint.color = Color.BLACK
        paint.textSize = 9.5f
        canvas.drawText("અધિકૃત સહીકર્તા", (sigLeft + sigRight) / 2, sigTop + sigHeight - 10f, paint)

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
     * Generates a standard A4 PDF voucher document for a purchase matching Shree Nandini Seeds layout.
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

        // Background White
        canvas.drawColor(Color.WHITE)

        // Outer Page Border
        strokePaint.color = Color.BLACK
        strokePaint.strokeWidth = 1.5f
        canvas.drawRect(26f, 26f, (pageWidth - 26).toFloat(), (pageHeight - 26).toFloat(), strokePaint)

        // Header - Brand Left & Gujarati Right
        paint.color = Color.rgb(13, 92, 44) // #0D5C2C
        paint.textSize = 13.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("Shree Nandini", 88f, 56f, paint)

        paint.textSize = 12f
        canvas.drawText("Seeds 🌱", 88f, 72f, paint)

        // Vertical divider
        strokePaint.color = Color.rgb(13, 92, 44)
        strokePaint.strokeWidth = 1.5f
        canvas.drawLine(145f, 42f, 145f, 82f, strokePaint)

        // Right Gujarati Title
        paint.textSize = 24f
        paint.textAlign = Paint.Align.LEFT
        canvas.drawText("શ્રી નંદિની સીડ્સ", 168f, 68f, paint)

        // Bottom green line
        strokePaint.strokeWidth = 2.5f
        canvas.drawLine(26f, 92f, (pageWidth - 26).toFloat(), 92f, strokePaint)

        // Bill No & Date Box (Top Left)
        val noBoxTop = 104f
        val noBoxWidth = 160f
        val noBoxHeight = 44f
        strokePaint.color = Color.BLACK
        strokePaint.strokeWidth = 1.2f
        canvas.drawRect(38f, noBoxTop, 38f + noBoxWidth, noBoxTop + noBoxHeight, strokePaint)
        canvas.drawLine(38f, noBoxTop + 22f, 38f + noBoxWidth, noBoxTop + 22f, strokePaint)

        paint.color = Color.BLACK
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.LEFT
        val cleanBillNo = pur.billNo.replace(Regex("^SN-PUR-\\d{4}-"), "")
        canvas.drawText("ખરીદી નં. : $cleanBillNo", 46f, noBoxTop + 15f, paint)
        canvas.drawText("તારીખ : ${formatBillDate(pur.purchaseDate)}", 46f, noBoxTop + 37f, paint)

        // Customer / Party Details Box
        val custTop = 158f
        val hasTruck = pur.truckNo.isNotEmpty()
        val custHeight = if (hasTruck) 88f else 66f
        canvas.drawRect(38f, custTop, (pageWidth - 38).toFloat(), custTop + custHeight, strokePaint)
        canvas.drawLine(38f, custTop + 22f, (pageWidth - 38).toFloat(), custTop + 22f, strokePaint)
        canvas.drawLine(38f, custTop + 44f, (pageWidth - 38).toFloat(), custTop + 44f, strokePaint)
        canvas.drawLine((pageWidth / 2).toFloat(), custTop + 44f, (pageWidth / 2).toFloat(), custTop + (if (hasTruck) 66f else custHeight), strokePaint)

        val partyDisp = if (pur.firmName.isNotEmpty()) "${pur.partyName} (${pur.firmName})" else pur.partyName
        canvas.drawText("નામ : $partyDisp", 46f, custTop + 15f, paint)
        canvas.drawText("ગામ : ${pur.village.ifEmpty { "—" }}", 46f, custTop + 37f, paint)
        canvas.drawText("તાલુકો : દિયોદર", 46f, custTop + 59f, paint)
        canvas.drawText("જિલ્લો : વાવ - થરાદ", (pageWidth / 2) + 10f, custTop + 59f, paint)

        if (hasTruck) {
            canvas.drawLine(38f, custTop + 66f, (pageWidth - 38).toFloat(), custTop + 66f, strokePaint)
            val truckDisp = if (pur.truckOwner.isNotEmpty()) "${pur.truckNo} (${pur.truckOwner})" else pur.truckNo
            canvas.drawText("ગાડી નં. : $truckDisp", 46f, custTop + 81f, paint)
        }

        // Items Table
        val tblTop = custTop + custHeight + 12f
        val tblHeight = 24f
        val cols = floatArrayOf(38f, 115f, 215f, 280f, 370f, 455f, (pageWidth - 38).toFloat())

        // Header fill
        paint.color = Color.rgb(220, 242, 217) // #dcf2d9
        canvas.drawRect(38f, tblTop, (pageWidth - 38).toFloat(), tblTop + tblHeight, paint)
        canvas.drawRect(38f, tblTop, (pageWidth - 38).toFloat(), tblTop + tblHeight, strokePaint)

        cols.forEach { x ->
            canvas.drawLine(x, tblTop, x, tblTop + tblHeight, strokePaint)
        }

        paint.color = Color.BLACK
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER

        canvas.drawText("પાક", (cols[0] + cols[1]) / 2, tblTop + 16f, paint)
        canvas.drawText("જાત", (cols[1] + cols[2]) / 2, tblTop + 16f, paint)
        canvas.drawText("બેગ (નંગ)", (cols[2] + cols[3]) / 2, tblTop + 16f, paint)
        canvas.drawText("જથ્થો (કિ.ગ્રા.)", (cols[3] + cols[4]) / 2, tblTop + 16f, paint)
        canvas.drawText("દર (રૂ./મણ)", (cols[4] + cols[5]) / 2, tblTop + 16f, paint)
        canvas.drawText("રકમ (રૂ.)", (cols[5] + cols[6]) / 2, tblTop + 16f, paint)

        var currentY = tblTop + tblHeight
        val rowHeight = 25f

        pur.items.forEach { it ->
            canvas.drawRect(38f, currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, strokePaint)
            cols.forEach { x ->
                canvas.drawLine(x, currentY, x, currentY + rowHeight, strokePaint)
            }

            paint.color = Color.BLACK
            paint.textAlign = Paint.Align.CENTER
            paint.textSize = 9.5f

            val totalKg = if (it.netWeightKg > 0) it.netWeightKg else (it.bags * 35.0)

            canvas.drawText("મગફળી", (cols[0] + cols[1]) / 2, currentY + 17f, paint)
            canvas.drawText(it.varietyName, (cols[1] + cols[2]) / 2, currentY + 17f, paint)
            canvas.drawText("${it.bags}", (cols[2] + cols[3]) / 2, currentY + 17f, paint)
            canvas.drawText("${totalKg.toInt()}", (cols[3] + cols[4]) / 2, currentY + 17f, paint)
            canvas.drawText(String.format(Locale.US, "%,.0f", it.ratePerMan), (cols[4] + cols[5]) / 2, currentY + 17f, paint)
            canvas.drawText(String.format(Locale.US, "%,.0f", it.itemTotal), (cols[5] + cols[6]) / 2, currentY + 17f, paint)

            currentY += rowHeight
        }

        // Expenses Rows (મજૂરી, માર્કેટ કમિશન, પેઢી કમિશન, બારદાન ખર્ચ)
        val isFarmer = pur.purchaseType == "farmer"
        fun drawExpenseRow(label: String, amount: Double, isDeduction: Boolean = false) {
            if (amount <= 0) return
            canvas.drawRect(38f, currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, strokePaint)
            cols.forEach { x ->
                canvas.drawLine(x, currentY, x, currentY + rowHeight, strokePaint)
            }
            paint.color = Color.BLACK
            paint.textAlign = Paint.Align.CENTER
            canvas.drawText(label, (cols[4] + cols[5]) / 2, currentY + 17f, paint)
            val valText = if (isDeduction) "- " + String.format(Locale.US, "%,.0f", amount) else String.format(Locale.US, "%,.0f", amount)
            canvas.drawText(valText, (cols[5] + cols[6]) / 2, currentY + 17f, paint)
            currentY += rowHeight
        }

        drawExpenseRow(if (isFarmer) "બાદ: મજૂરી" else "મજૂરી", pur.majuriAmount, isDeduction = isFarmer)
        drawExpenseRow("માર્કેટ કમિશન", pur.marketCommission)
        drawExpenseRow("પેઢી કમિશન", pur.firmCommission)
        drawExpenseRow("બારદાન ખર્ચ", pur.bardanExpense)

        // Total Row (કુલ રકમ)
        paint.color = Color.rgb(220, 242, 217) // #dcf2d9
        canvas.drawRect(cols[4], currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, paint)
        canvas.drawRect(38f, currentY, (pageWidth - 38).toFloat(), currentY + rowHeight, strokePaint)
        cols.forEach { x ->
            canvas.drawLine(x, currentY, x, currentY + rowHeight, strokePaint)
        }
        paint.color = Color.BLACK
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("કુલ રકમ", (cols[4] + cols[5]) / 2, currentY + 17f, paint)
        canvas.drawText(String.format(Locale.US, "%,.0f", pur.netTotal), (cols[5] + cols[6]) / 2, currentY + 17f, paint)
        currentY += rowHeight

        // Amount in Words Box
        val wordsTop = currentY + 16f
        val wordsHeight = 48f
        paint.color = Color.rgb(220, 242, 217)
        canvas.drawRect(38f, wordsTop, (pageWidth - 38).toFloat(), wordsTop + 22f, paint)
        canvas.drawRect(38f, wordsTop, (pageWidth - 38).toFloat(), wordsTop + wordsHeight, strokePaint)
        canvas.drawLine(38f, wordsTop + 22f, (pageWidth - 38).toFloat(), wordsTop + 22f, strokePaint)

        paint.color = Color.BLACK
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 9.5f
        canvas.drawText("રકમ અક્ષરે (રૂપિયામાં) :", 46f, wordsTop + 15f, paint)
        canvas.drawText(numberToGujaratiWords(pur.netTotal), 46f, wordsTop + 38f, paint)

        // Signatory Box (Bottom Right)
        val sigTop = wordsTop + wordsHeight + 20f
        val sigRight = (pageWidth - 38).toFloat()
        val sigLeft = sigRight - 180f
        val sigHeight = 85f
        canvas.drawRect(sigLeft, sigTop, sigRight, sigTop + sigHeight, strokePaint)

        paint.color = Color.rgb(13, 92, 44)
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = 11f
        canvas.drawText("શ્રી નંદિની સીડ્સ તરફથી,", (sigLeft + sigRight) / 2, sigTop + 24f, paint)

        canvas.drawLine(sigLeft + 25f, sigTop + sigHeight - 25f, sigRight - 25f, sigTop + sigHeight - 25f, strokePaint)

        paint.color = Color.BLACK
        paint.textSize = 9.5f
        canvas.drawText("અધિકૃત સહીકર્તા", (sigLeft + sigRight) / 2, sigTop + sigHeight - 10f, paint)

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
