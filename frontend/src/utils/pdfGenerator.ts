import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type ChatMessage = {
  query: string;
  response: string;
  timestamp?: Date;
};

export const generateChatPDF = async (messages: ChatMessage[], filename: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Chat with Your Code - Q&A Export', 105, 15, { align: 'center' });
  
  let yPos = 25;
  const lineHeight = 7;
  
  messages.forEach((msg, idx) => {
    // Question
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 255); // Blue
    doc.setFont('helvetica', 'bold');
    doc.text(`Q${idx + 1}: ${msg.query}`, 14, yPos);
    yPos += lineHeight;
    
    // Answer
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Black
    doc.setFont('courier', 'normal');
    
    const splitText = doc.splitTextToSize(msg.response, 180);
    doc.text(splitText, 14, yPos);
    yPos += splitText.length * lineHeight + 5;
    
    // Page break
    if (yPos > 270 && idx < messages.length - 1) {
      doc.addPage();
      yPos = 20;
    }
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Exported on ${new Date().toLocaleString()}`, 14, 285);
  
  doc.save(`${filename}.pdf`);
};