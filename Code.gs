function doGet(e) {
  try {
    // Return HTML UI if no clientId provided
    if (!e || !e.parameter || !e.parameter.clientId) {
      return HtmlService.createHtmlOutputFromFile('crm')
        .setTitle('Switchcore CRM')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    var clientId = String(e.parameter.clientId).trim();
    var sheet = SpreadsheetApp.openById('1K-5GcOrpKf4K7dS9LxH1d9NksNGr-yT4KK4fs3wwC1k')
                   .getSheetByName('Sheet1');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    // Find client row (compatible with all JS engines)
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === clientId) {
        var clientData = {};
        headers.forEach(function(header, index) {
          clientData[header] = data[i][index] || ''; // Handle empty cells
        });
        return ContentService.createTextOutput(JSON.stringify(clientData))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({error: "Client not found", id: clientId})
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error: " + error);
    return ContentService.createTextOutput(
      JSON.stringify({error: "Server error", details: error.message})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function for frontend
function getClientData(clientId) {
  return doGet({parameter: {clientId: clientId}}).getContent();
}

// For saving notes
function updateClientNotes(clientId, notes) {
  var sheet = SpreadsheetApp.openById('1K-5GcOrpKf4K7dS9LxH1d9NksNGr-yT4KK4fs3wwC1k')
                 .getSheetByName('Sheet1');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(clientId).trim()) {
      var notesCol = data[0].indexOf('clientNotes');
      if (notesCol !== -1) {
        sheet.getRange(i + 1, notesCol + 1).setValue(notes);
        return true;
      }
    }
  }
  return false;
}
