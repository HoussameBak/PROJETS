import { renderAsync } from "docx-preview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { generateDocxBlob } from "./generateDocx.js";

/**
 * Renderiza un .docx (blob) en un contenedor oculto usando docx-preview
 * (conserva negritas, párrafos, tablas y espaciado), y captura cada
 * página con html2canvas para componer un PDF fiel con jsPDF.
 */
export async function generatePdfBlob(docxBlob) {
  const container = document.createElement("div");
  // Fuera de la vista pero renderizado (display:none impediría medir/capturar).
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-10000px";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  try {
    await renderAsync(docxBlob, container, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      experimental: true,
    });

    const pages = container.querySelectorAll(".docx");
    if (!pages.length) {
      throw new Error("No se pudo renderizar el documento para generar el PDF.");
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      let imgWidth = pdfWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Rellena la plantilla, la convierte a PDF (fiel al formato del .docx:
 * negritas, párrafos, tabla de firmas) y descarga el resultado.
 */
export async function downloadContractPdf(arrayBuffer, values, fileName) {
  const docxBlob = generateDocxBlob(arrayBuffer, values);
  const pdfBlob = await generatePdfBlob(docxBlob);
  saveAs(pdfBlob, fileName);
}
