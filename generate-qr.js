const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const url = 'http://192.168.1.86:3000';
const outputPath = path.join(__dirname, 'qr-code.png');

QRCode.toFile(outputPath, url, {
  errorCorrectionLevel: 'H',
  type: 'png',
  width: 300,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}, function (err) {
  if (err) {
    console.error('Error generating QR code:', err);
    process.exit(1);
  }
  console.log('QR code generated successfully!');
  console.log(`File saved to: ${outputPath}`);
  console.log(`URL: ${url}`);
  
  // Also display ASCII QR code in terminal
  QRCode.toString(url, { type: 'terminal' }, function (err, string) {
    if (err) {
      console.error('Error generating ASCII QR code:', err);
      return;
    }
    console.log('\nASCII QR Code:');
    console.log(string);
  });
});


