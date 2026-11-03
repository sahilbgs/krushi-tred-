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
