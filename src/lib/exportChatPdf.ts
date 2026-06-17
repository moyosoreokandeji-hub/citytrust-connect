import { jsPDF } from "jspdf";
import type { ArtisanProfile, ChatMessage } from "@/lib/store";

export function exportChatTranscriptPdf(artisan: ArtisanProfile, messages: ChatMessage[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CityTrust — Chat Transcript", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Verified Service Access · Redemption City", margin, 50);

  y = 96;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Artisan: ${artisan.business_name}`, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Zone: ${artisan.location_zone}  ·  Rating: ${artisan.rating.toFixed(1)} ★  ·  Trust: ${artisan.trust_score}/100`, margin, y);
  y += 14;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);

  const maxW = pageW - margin * 2 - 70;

  for (const m of messages) {
    const sender = m.sender === "resident" ? "Resident" : "Artisan";
    const time = new Date(m.created_at).toLocaleString();
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.sender === "resident" ? 37 : 22, m.sender === "resident" ? 99 : 101, m.sender === "resident" ? 235 : 52);
    const header = `${sender}  ·  ${time}`;
    if (y > pageH - margin - 40) { doc.addPage(); y = margin; }
    doc.text(header, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(m.text, maxW);
    for (const ln of lines) {
      if (y > pageH - margin - 20) { doc.addPage(); y = margin; }
      doc.text(ln, margin + 12, y);
      y += 14;
    }
    y += 8;
  }

  // Footer note
  if (y > pageH - margin - 30) { doc.addPage(); y = margin; }
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 14;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("This transcript was exported from CityTrust for accountability and admin review.", margin, y);

  const safe = artisan.business_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`citytrust-chat-${safe}.pdf`);
}
