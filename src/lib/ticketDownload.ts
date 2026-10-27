/**
 * Turns the on-screen ticket artwork into a downloadable PNG or PDF.
 * Both libraries are loaded on demand so they never weigh down first paint.
 */

async function capture(node: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas-pro");
  return html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function saveTicketImage(node: HTMLElement, filename: string) {
  const canvas = await capture(node);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/png", 1)
  );
  if (!blob) throw new Error("Could not render the ticket image.");
  saveBlob(blob, `${filename}.png`);
}

export async function saveTicketPdf(node: HTMLElement, filename: string) {
  const { jsPDF } = await import("jspdf");
  const canvas = await capture(node);

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;

  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const width = canvas.width * ratio;
  const height = canvas.height * ratio;

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (pageWidth - width) / 2,
    (pageHeight - height) / 2,
    width,
    height
  );
  pdf.save(`${filename}.pdf`);
}