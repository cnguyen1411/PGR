const express = require('express');
const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const QRCode = require('qrcode');

const router = express.Router();
const deviceInfoFile = path.join(__dirname, '../device_info.csv');
const screenInfoFile = path.join(__dirname, '../screen_info.csv'); // Add this line for screen info


router.get('/input', (req, res) => {
  res.render('input_device_info', { page: 'page_name', user: req.session.user });
});

router.post('/save', express.json(), (req, res) => {
  const { customerName, trackingNumber, dateAccepted, sendingType, devices, screens } = req.body;
  console.log('Form Data:', req.body); // Debugging line to check form data

  if (sendingType === 'devices') {
    if (!devices || devices.length === 0) {
      return res.status(400).json({ success: false, message: 'No devices data provided' });
    }

    const dataToSave = devices.map(device => ({
      customerName,
      trackingNumber,
      dateAccepted,
      ...device,
    }));

    const csv = parse(dataToSave, { header: false });
    fs.appendFileSync(deviceInfoFile, csv + '\n');
    res.json({ success: true, results: dataToSave });
  } else if (sendingType === 'screens') {
    if (!screens || screens.length === 0) {
      return res.status(400).json({ success: false, message: 'No screens data provided' });
    }

    const dataToSave = screens.map(screen => ({
      customerName,
      trackingNumber,
      dateAccepted,
      ...screen,
    }));

    const csv = parse(dataToSave, { header: false });
    fs.appendFileSync(screenInfoFile, csv + '\n');
    res.json({ success: true, results: dataToSave });
  }
});

router.get('/success', (req, res) => {
  const results = JSON.parse(req.query.results || '[]');
  res.render('success', { results, page: 'input' });
});

router.get('/success_screen', (req, res) => {
  const results = JSON.parse(req.query.results || '[]');
  res.render('success_screen', { results, page: 'input' });
});

router.get('/search', (req, res) => {
  res.render('search_device', { page: 'search_device', user: req.session.user });
});

router.post('/search', (req, res) => {
  const { imei } = req.body;
  const last5Digits = imei.slice(-5);
  const results = [];

  fs.createReadStream(deviceInfoFile)
    .pipe(csvParser({
      headers: ['customerName', 'trackingNumber', 'dateAccepted', 'brand', 'model', 'storage', 'imei', 'color']
    }))
    .on('data', (data) => {
      console.log('Data received:', data); // Log received data for debugging
      if (data.imei && data.imei.endsWith(last5Digits)) {
        results.push(data);
      }
    })
    .on('end', () => {
      console.log(`Search results: ${JSON.stringify(results)}`); // Log results for debugging
      res.render('search_results', { results, page: 'search' });
    });
});

router.get('/list_devices', (req, res) => {
  const results = [];

  fs.createReadStream(deviceInfoFile)
    .pipe(csvParser({
      headers: ['customerName', 'trackingNumber', 'dateAccepted', 'brand', 'model', 'storage', 'imei', 'color']
    }))
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      res.render('list_devices', { results, page: 'list_devices', user: req.session.user });
    });
});

router.get('/list_screens', (req, res) => {
  const results = [];

  fs.createReadStream(screenInfoFile)
    .pipe(csvParser({
      headers: ['customerName', 'trackingNumber', 'dateAccepted', 'model', 'quantity']
    }))
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      res.render('list_screens', { results, page: 'list_screens', user: req.session.user });
    });
});

router.get('/print/:imei', async (req, res) => {
  const imei = req.params.imei;
  const last5Digits = imei.slice(-5);
  const results = [];

  // Read the CSV file to get the customer name associated with the IMEI
  fs.createReadStream(deviceInfoFile)
    .pipe(csvParser({
      headers: ['customerName', 'trackingNumber', 'dateAccepted', 'brand', 'model', 'storage', 'imei', 'color']
    }))
    .on('data', (data) => {
      if (data.imei === imei) {
        results.push(data);
      }
    })
    .on('end', async () => {
      if (results.length === 0) {
        return res.status(404).send('Device not found');
      }

      const customerName = results[0].customerName;
      const customerInitials = customerName.slice(0, 3).toUpperCase();

      try {
        const qrCodeDataURL = await QRCode.toDataURL(imei, { width: 100 });

        res.render('print_qr', { imei, last5Digits, customerInitials, qrCodeDataURL });
      } catch (error) {
        res.status(500).send('Error generating QR code');
      }
    });
});

router.get('/print_screen/:model/:trackingNumber', async (req, res) => {
  const { model, trackingNumber } = req.params;
  const results = [];

  // Read the CSV file to get the customer name associated with the model and tracking number
  fs.createReadStream(screenInfoFile)
    .pipe(csvParser({
      headers: ['customerName', 'trackingNumber', 'dateAccepted', 'model', 'quantity']
    }))
    .on('data', (data) => {
      if (data.model === model && data.trackingNumber === trackingNumber) {
        results.push(data);
      }
    })
    .on('end', async () => {
      if (results.length === 0) {
        return res.status(404).send('Screen not found');
      }

      const customerName = results[0].customerName;
      const customerInitials = customerName.slice(0, 3).toUpperCase();

      try {
        const qrCodeDataURL = await QRCode.toDataURL(trackingNumber, { width: 100 });

        res.render('print_screen_qr', { trackingNumber, customerInitials, qrCodeDataURL });
      } catch (error) {
        res.status(500).send('Error generating QR code');
      }
    });
});
router.get('/search_screen', (req, res) => {
  res.render('search_screen', { page: 'search_screen', user: req.session.user });
});

router.post('/search_screen', (req, res) => {
  const { searchType, searchValue } = req.body;
  const results = [];

  fs.createReadStream(screenInfoFile)
    .pipe(csvParser({
      headers: ['customerName', 'trackingNumber', 'dateAccepted', 'model', 'quantity']
    }))
    .on('data', (data) => {
      if ((searchType === 'trackingNumber' && data.trackingNumber === searchValue) ||
          (searchType === 'customerName' && data.customerName === searchValue)) {
        results.push(data);
      }
    })
    .on('end', () => {
      res.render('search_screen_results', { results, page: 'search_screen' });
    });
});


module.exports = router;
