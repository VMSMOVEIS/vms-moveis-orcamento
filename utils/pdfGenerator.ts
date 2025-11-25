
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectStats, CardRate, AppSettings, AdditionalService } from '../types';

// Simple Base64 Icons (Standardized for PDF)
const ICON_PHONE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAcklEQVQ4je2RUQqAIBAF1826W/W03q2fQch+7GMQCNZZXQs/Q2s9iog4yLnoA0RkM2aO3j0z57L3XgC89wIAY8wN8H1fAGCtbYAQggB45w8A+r4XALTWZgD33A3gnBsA1lozwFp7A1hrG6C1NgE8809E5AJLpW9/nL4fKwAAAABJRU5ErkJggg==";
const ICON_WHATSAPP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAdklEQVQ4je2SwQ3AIAxD30y6W/W03q2fIVgP6zEIAm1C+1s+yXEcR0R8yLnoA0RkM2aO3j0z57L3XgC89wIAY8wN8H1fAGCtbYAQggB45w8A+r4XALTWZgD33A3gnBsA1lozwFp7A1hrG6C1NgE8809E5AJLpW9/nL4fKw09b3+Uv2e7AAAAAElFTkSuQmCC"; 
const ICON_EMAIL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAcUlEQVQ4je2SUQqAIBAF1826W/W03q2fQch+7GMQCNZZXQs/Q2s9iog4yLnoA0RkM2aO3j0z57L3XgC89wIAY8wN8H1fAGCtbYAQggB45w8A+r4XALTWZgD33A3gnBsA1lozwFp7A1hrG6C1NgE8809E5AJLpW9/nL4fKwAAAABJRU5ErkJggg=="; 

export const createProposalDocument = (
  stats: ProjectStats,
  cardRates: CardRate[],
  settings: AppSettings,
  clientName: string,
  clientPhone: string,
  projectName: string,
  additionalServices: AdditionalService[],
  serviceDescription: string,
  validityDays: string,
  warrantyTime?: string,
  deliveryTime?: string,
  paymentCondition?: string,
  images?: string[],
  includeContract?: boolean,
  customProposalNumber?: string
): jsPDF => {
  const doc = new jsPDF();
  
  // Colors - Azul Marinho Profundo (Dark Navy)
  // RGB: 0, 43, 85
  const COLOR_DARK_NAVY: [number, number, number] = [0, 43, 85]; 
  const COLOR_PRIMARY = COLOR_DARK_NAVY;
  const COLOR_ACCENT = COLOR_DARK_NAVY;
  
  const COLOR_TEXT: [number, number, number] = [50, 50, 50];
  const COLOR_TEXT_LIGHT: [number, number, number] = [100, 100, 100];

  // Helper: Format Currency
  const fmtMoney = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calculations
  const totalGross = stats.salesPrice + stats.discountValue;
  const servicesTotal = additionalServices.reduce((acc, s) => acc + s.value, 0);
  const furniturePrice = Math.max(0, totalGross - servicesTotal);
  const finalSalesPrice = stats.salesPrice;

  // Helper: Calculate Card Price based on FINAL price
  const calculateCardPrice = (cashPrice: number, ratePercent: number) => {
      return cashPrice / (1 - (ratePercent / 100));
  };

  // --- HEADER SECTION ---
  const pageWidth = 210; // A4 width in mm
  
  // 1. Logo (Left Aligned)
  let logoWidthUsed = 0;
  if (settings.logo) {
      try {
          // Use jspdf method to get image properties synchronously
          const props = doc.getImageProperties(settings.logo);
          const ratio = props.width / props.height;
          
          const maxWidth = 40;
          const maxHeight = 35;
          
          let w = maxWidth;
          let h = w / ratio;
          
          if (h > maxHeight) {
              h = maxHeight;
              w = h * ratio;
          }

          const logoX = 15; // Left margin
          doc.addImage(settings.logo, 'PNG', logoX, 10, w, h, undefined, 'FAST');
          logoWidthUsed = w + 10; // Space for text to start after logo
      } catch (e) {
          console.warn("Invalid logo format");
      }
  }

  // 2. Company Info (Next to Logo or Left Aligned)
  let infoY = 15;
  const infoX = 15 + (logoWidthUsed > 0 ? logoWidthUsed : 0); // Start after logo or at margin

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text((settings.companyName || "Sua Empresa").toUpperCase(), infoX, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  
  infoY += 5;
  
  if (settings.companyCorporateName) {
      doc.text(settings.companyCorporateName, infoX, infoY);
      infoY += 4;
  }
  
  if (settings.companyCNPJ) {
      doc.text(`CNPJ: ${settings.companyCNPJ}`, infoX, infoY);
      infoY += 4;
  }
  
  // Format Address: Rua, Num - Bairro, Cidade - CEP
  let addressLine = settings.companyAddress || "";
  if(settings.companyNeighborhood) addressLine += ` - ${settings.companyNeighborhood}`;
  if(settings.companyCity) addressLine += `, ${settings.companyCity}`;
  if(settings.companyCEP) addressLine += ` - CEP: ${settings.companyCEP}`;

  if (addressLine) {
      // Handle potentially long address lines
      const splitAddr = doc.splitTextToSize(addressLine, 90); // Limited width to not hit contacts
      doc.text(splitAddr, infoX, infoY);
      infoY += (splitAddr.length * 4);
  }

  // 3. Contact Info (Right Aligned)
  const rightMargin = 195;
  let contactY = 15;
  
  // Date
  const today = new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${today}`, rightMargin, contactY, { align: 'right' });
  contactY += 6;

  const iconSize = 3.5; 
  const iconGap = 1.5; 

  if (settings.companyEmail) {
      const textWidth = doc.getTextWidth(settings.companyEmail);
      try {
        doc.addImage(ICON_EMAIL, 'PNG', rightMargin - textWidth - iconSize - iconGap, contactY - 2.5, iconSize, iconSize);
      } catch(e) {}
      doc.text(settings.companyEmail, rightMargin, contactY, { align: 'right' });
      contactY += 5;
  }
  
  if (settings.companyPhone) {
      const textWidth = doc.getTextWidth(settings.companyPhone);
      try {
        doc.addImage(ICON_PHONE, 'PNG', rightMargin - textWidth - iconSize - iconGap, contactY - 2.5, iconSize, iconSize);
      } catch(e) {}
      doc.text(settings.companyPhone, rightMargin, contactY, { align: 'right' });
      contactY += 5;
  }

  if (settings.companyWhatsapp) {
      const textWidth = doc.getTextWidth(settings.companyWhatsapp);
      try {
        doc.addImage(ICON_WHATSAPP, 'PNG', rightMargin - textWidth - iconSize - iconGap, contactY - 2.5, iconSize, iconSize);
      } catch(e) {}
      doc.text(settings.companyWhatsapp, rightMargin, contactY, { align: 'right' });
      contactY += 5;
  }


  // --- TITLE BAR ---
  // Starts below logo (approx 55mm down, giving space for larger logos)
  const titleBarY = 55;
  const proposalNumber = customProposalNumber || `Orçamento ${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`; 
  
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(15, titleBarY, 180, 8, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(proposalNumber, 20, titleBarY + 5.5);

  // --- CLIENT SECTION ---
  doc.setFillColor(245, 245, 245); // Light gray bg for client
  doc.rect(15, titleBarY + 8, 180, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`Cliente: ${clientName}`, 20, titleBarY + 14);
  if (clientPhone) {
      doc.setFont("helvetica", "normal");
      doc.text(` - Tel: ${clientPhone}`, doc.getTextWidth(`Cliente: ${clientName}`) + 22, titleBarY + 14);
  }

  let currentY = titleBarY + 25;

  // --- TABLE 1: PRODUCTS / FURNITURE ---
  
  // Title Bar for Products
  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("Produtos / Móveis Planejados", 20, currentY + 5);
  currentY += 8;

  const productsBody = [
      [
          projectName.toUpperCase(),
          "un.",
          fmtMoney(furniturePrice),
          "1",
          fmtMoney(furniturePrice)
      ]
  ];

  autoTable(doc, {
      startY: currentY,
      head: [['Descrição', 'Unidade', 'Preço Unit.', 'Qtd.', 'Subtotal']],
      body: productsBody,
      theme: 'plain',
      headStyles: { 
          fillColor: [255, 255, 255] as [number, number, number], 
          textColor: COLOR_TEXT_LIGHT, 
          fontSize: 8, 
          fontStyle: 'bold',
          lineWidth: 0 
      },
      styles: { 
          fontSize: 9, 
          cellPadding: 3,
          textColor: COLOR_TEXT
      },
      columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          2: { halign: 'right' },
          3: { halign: 'center' },
          4: { halign: 'right' }
      },
      margin: { left: 15, right: 15 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // --- TABLE 2: SERVICES (If any) ---
  if (additionalServices.length > 0) {
      // Title Bar for Services
      doc.setFillColor(240, 240, 240);
      doc.rect(15, currentY, 180, 7, 'F');
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text("Serviços Adicionais", 20, currentY + 5);
      currentY += 8;

      const servicesBody = additionalServices.map(s => [
          s.description,
          "vb",
          fmtMoney(s.value),
          "1",
          fmtMoney(s.value)
      ]);

      autoTable(doc, {
          startY: currentY,
          head: [['Descrição', 'Unidade', 'Preço', 'Qtd.', 'Subtotal']],
          body: servicesBody,
          theme: 'plain',
          headStyles: { 
              fillColor: [255, 255, 255] as [number, number, number], 
              textColor: COLOR_TEXT_LIGHT, 
              fontSize: 8, 
              fontStyle: 'bold',
              lineWidth: 0
          },
          styles: { 
              fontSize: 9, 
              cellPadding: 3,
              textColor: COLOR_TEXT
          },
          columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 80 },
              2: { halign: 'right' },
              3: { halign: 'center' },
              4: { halign: 'right' }
          },
          margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // --- TOTALS BOX (Right Aligned) ---
  const boxWidth = 70;
  const boxX = 195 - boxWidth;
  
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  
  // Subtotal Label
  doc.text("Subtotal", boxX, currentY);
  doc.text(fmtMoney(totalGross), 195, currentY, { align: 'right' });
  currentY += 5;

  // Discount
  if (stats.discountValue > 0) {
      doc.text("Desconto", boxX, currentY);
      doc.text(`- ${fmtMoney(stats.discountValue)}`, 195, currentY, { align: 'right' });
      currentY += 5;
  }

  // Total Bar
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(boxX - 2, currentY - 3, boxWidth + 2, 8, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Total Geral", boxX, currentY + 2);
  doc.text(fmtMoney(finalSalesPrice), 195, currentY + 2, { align: 'right' });
  
  currentY += 15;

  // --- PAYMENT SECTION ---
  if (currentY > 220) {
      doc.addPage();
      currentY = 20;
  }

  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("Pagamento", 20, currentY + 5);
  currentY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Condição Selecionada:", 20, currentY);
  
  // Dynamic Payment Text
  doc.setFont("helvetica", "normal");
  let paymentText = "Dinheiro, Pix, Cartão de Crédito/Débito";
  
  if (paymentCondition === 'Sinal 50%') {
      paymentText = "Sinal de 50% no ato do fechamento e o restante (50%) na entrega.";
  } else if (paymentCondition === 'À Vista') {
      paymentText = "Pagamento à vista com desconto já aplicado.";
  } else if (paymentCondition === 'Parcelado') {
      paymentText = "Parcelamento via cartão de crédito (Consulte a tabela abaixo).";
  }
  
  doc.text(paymentText, 60, currentY);
  currentY += 10;

  // Card Table (if rates exist)
  const hasCardRates = cardRates && cardRates.length > 0;
  
  if (hasCardRates) {
      doc.setFont("helvetica", "bold");
      doc.text("Simulação de Parcelamento (Cartão)", 20, currentY);
      currentY += 3;

      const cardTableBody = [];
      
      // Cash
      cardTableBody.push([
          "À Vista",
          "-",
          fmtMoney(finalSalesPrice)
      ]);

      // Sort rates
      const sortedRates = [...cardRates].sort((a, b) => a.installments - b.installments);

      sortedRates.forEach(cr => {
          const totalWithRate = calculateCardPrice(finalSalesPrice, cr.rate);
          const installmentValue = totalWithRate / cr.installments;
          cardTableBody.push([
              `${cr.installments}x`,
              fmtMoney(installmentValue),
              fmtMoney(totalWithRate)
          ]);
      });

      autoTable(doc, {
          startY: currentY, 
          head: [['Opção', 'Parcela', 'Total']],
          body: cardTableBody,
          theme: 'striped',
          headStyles: { 
              fillColor: COLOR_ACCENT, 
              textColor: [255, 255, 255], 
              fontSize: 8, 
              fontStyle: 'bold',
              halign: 'center'
          },
          styles: { 
              fontSize: 8, 
              cellPadding: 2,
              textColor: COLOR_TEXT
          },
          columnStyles: {
              0: { halign: 'center', cellWidth: 20 },
              1: { halign: 'right' },
              2: { halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 15, right: 15 }, // Adjusted for full width
      });
      
      const tableFinalY = (doc as any).lastAutoTable.finalY;
      currentY = Math.max(currentY + 10, tableFinalY + 10);
  }

  // --- WARRANTY & DELIVERY SECTION ---
  if (currentY > 230) {
      doc.addPage();
      currentY = 20;
  }

  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("Garantia e Prazos", 20, currentY + 5);
  currentY += 12;

  doc.setFontSize(10);
  
  // Warranty Highlight
  if (warrantyTime) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text(`PRAZO DE GARANTIA: ${warrantyTime.toUpperCase()}`, 20, currentY);
    currentY += 6;
  }

  // Delivery Highlight
  if (deliveryTime) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text(`PRAZO DE ENTREGA: ${deliveryTime.toUpperCase()}`, 20, currentY);
    currentY += 8;
  }

  // Terms text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

  const terms = (settings.warrantyTerms || "").split('\n');
  
  terms.forEach(term => {
      const splitText = doc.splitTextToSize(term, 175);
      if (currentY + (splitText.length * 4) > 270) {
          doc.addPage();
          currentY = 20;
      }
      doc.text(splitText, 20, currentY);
      currentY += (splitText.length * 4) + 1;
  });

  // --- SERVICE DESCRIPTION ---
  if (serviceDescription) {
      currentY += 5;
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      
      doc.setFillColor(240, 240, 240);
      doc.rect(15, currentY, 180, 7, 'F');
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text("Informações Adicionais / Escopo", 20, currentY + 5);
      currentY += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      const descLines = doc.splitTextToSize(serviceDescription, 175);
      doc.text(descLines, 20, currentY);
      currentY += (descLines.length * 4) + 10;
  }

  // --- IMAGES SECTION (VERTICAL STACK) ---
  if (images && images.length > 0) {
    // Start images on a new page if not enough space
    if (currentY > 150) { 
        doc.addPage();
        currentY = 20;
    } else {
        currentY += 10; // Add some spacing before images
    }
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, currentY, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Imagens de Referência", 20, currentY + 5);
    currentY += 15;
    
    // Config for Vertical Stack
    const imgWidth = 140; // Wider images since they are stacked
    const imgHeight = 100;
    const xPos = (210 - imgWidth) / 2; // Center horizontally

    images.forEach((img) => {
        // Check page break for images
        if (currentY + imgHeight > 280) {
            doc.addPage();
            currentY = 30;
        }

        try {
            doc.addImage(img, 'JPEG', xPos, currentY, imgWidth, imgHeight, undefined, 'FAST');
            doc.setDrawColor(200);
            doc.rect(xPos, currentY, imgWidth, imgHeight); // Border
            currentY += imgHeight + 10; // Move down for next image
        } catch (e) { console.warn("Image add error", e)}
    });
    
    currentY += 10; // Extra spacing after images
  }

  // --- SIGNATURES SECTION ---
  if (currentY > 240) {
      doc.addPage();
      currentY = 50;
  } else {
      currentY = Math.max(currentY, 240); 
  }

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`${settings.companyCity ? settings.companyCity.split('/')[0] : 'Benevides'}, ${today}`, 105, currentY - 20, { align: 'center' });

  // Company Signature
  if (settings.signature) {
      try {
          const props = doc.getImageProperties(settings.signature);
          const ratio = props.width / props.height;
          const maxW = 50;
          const maxH = 20;
          let w = maxW;
          let h = w / ratio;
          if (h > maxH) { h = maxH; w = h * ratio; }

          doc.addImage(settings.signature, 'PNG', 55 - (w/2), currentY - 5 - h, w, h);
      } catch (e) {}
  }
  doc.line(20, currentY, 90, currentY); // Line left
  doc.text(settings.companyName || "V M S MÓVEIS", 55, currentY + 5, { align: 'center' });
  doc.text("Responsável Técnico", 55, currentY + 9, { align: 'center' });

  // Client Signature
  doc.line(110, currentY, 180, currentY); // Line right
  doc.text(clientName, 145, currentY + 5, { align: 'center' });
  doc.text("Cliente", 145, currentY + 9, { align: 'center' });

  // --- CONTRACT SECTION ---
  if (includeContract && settings.contractTerms) {
      doc.addPage();
      currentY = 20;

      // Contract Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 105, currentY, { align: 'center' });
      currentY += 15;

      // Contract Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

      const contractLines = doc.splitTextToSize(settings.contractTerms, 170);
      doc.text(contractLines, 20, currentY);
  }

  // --- FOOTER (Page Numbers) ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Página ${i}/${pageCount}`, 195, 290, { align: 'right' });
  }

  return doc;
};
