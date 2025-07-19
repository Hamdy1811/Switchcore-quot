/********************
 * CORE CRM FUNCTIONS *
 ********************/

function doGet(e) {
  try {
    // API Endpoint: Generate new ID
    if (e?.parameter?.generateNewId) {
      return ContentService.createTextOutput(generateNextClientId())
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // API Endpoint: Fetch client data
    if (e?.parameter?.clientId) {
      const clientId = String(e.parameter.clientId).trim();
      const clientData = getClientData(clientId);
      
      if (!clientData) {
        return ContentService.createTextOutput(
          JSON.stringify({error: "Client not found"})
        ).setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService.createTextOutput(JSON.stringify(clientData))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default: Serve HTML UI
    return HtmlService.createHtmlOutputFromFile('crm')
      .setTitle('Switchcore CRM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log(error);
    return ContentService.createTextOutput(
      JSON.stringify({error: "Server error", details: error.message})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function generateNextClientId() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  // Start with SC-001 if empty sheet
  if (lastRow === 1) return "SC-001";
  
  // Get all existing IDs
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 0;
  
  ids.forEach(id => {
    const num = parseInt(id[0]?.toString()?.match(/\d+$/)?.[0]) || 0;
    maxNum = Math.max(maxNum, num);
  });
  
  return `SC-${String(maxNum + 1).padStart(3, '0')}`;
}

function getClientData(clientId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(clientId).trim()) {
      const clientData = {};
      headers.forEach((header, index) => {
        clientData[header] = data[i][index] || '';
      });
      return clientData;
    }
  }
  return null;
}

function addNewClient(clientData) {
  const sheet = getSheet();
  sheet.appendRow([
    clientData.id,
    clientData.name,
    clientData.company || '',
    clientData.email || '',
    'New Lead', // Default stage
    clientData.tags || '',
    clientData.notes || '',
    '', // Sent date
    ''  // Reminder
  ]);
  return clientData.id;
}

function updateClientField(clientId, field, value) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(field);
  
  if (colIndex === -1) return false;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(clientId).trim()) {
      sheet.getRange(i + 1, colIndex + 1).setValue(value);
      return true;
    }
  }
  return false;
}

/**********************
 * QUOTATION FUNCTIONS *
 **********************/

function generateQuotationPDF(htmlContent) {
  const blob = Utilities.newBlob(htmlContent, 'text/html');
  const pdf = blob.getAs('application/pdf');
  return pdf.getBytes();
}

function emailQuotation(clientId, recipient, subject, body) {
  const clientData = getClientData(clientId);
  const htmlContent = HtmlService.createTemplateFromFile('quotation')
                   .evaluate()
                   .getContent();
  const pdfBytes = generateQuotationPDF(htmlContent);
  
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    attachments: [{
      fileName: `Quotation_${clientId}.pdf`,
      content: Utilities.base64Encode(pdfBytes),
      mimeType: 'application/pdf'
    }]
  });
}

/****************
 * HELPER FUNCTIONS *
 ****************/

function getSheet() {
  return SpreadsheetApp.openById('1K-5GcOrpKf4K7dS9LxH1d9NksNGr-yT4KK4fs3wwC1k')
          .getSheetByName('Sheet1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
