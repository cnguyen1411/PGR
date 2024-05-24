document.querySelectorAll('input[name="sendingType"]').forEach((elem) => {
  elem.addEventListener('change', function (event) {
    const value = event.target.value;
    const numberOfDevicesContainer = document.getElementById('numberOfDevicesContainer');
    const numberOfScreensContainer = document.getElementById('numberOfScreensContainer');
    const devicesContainer = document.getElementById('devicesContainer');
    const screensContainer = document.getElementById('screensContainer');

    if (value === 'devices') {
      numberOfDevicesContainer.style.display = 'block';
      numberOfScreensContainer.style.display = 'none';
      devicesContainer.style.display = 'grid';
      screensContainer.style.display = 'none';
    } else if (value === 'screens') {
      numberOfDevicesContainer.style.display = 'none';
      numberOfScreensContainer.style.display = 'block';
      devicesContainer.style.display = 'none';
      screensContainer.style.display = 'grid';
    }
  });
});

document.getElementById('numberOfDevices').addEventListener('input', function () {
  const numberOfDevices = this.value;
  const container = document.getElementById('devicesContainer');
  container.innerHTML = '';

  for (let i = 0; i < numberOfDevices; i++) {
    const deviceForm = document.createElement('div');
    deviceForm.classList.add('device-box');
    deviceForm.innerHTML = `
      <h3>Device ${i + 1}</h3>
      <label for="brand${i}">Brand:</label>
      <select name="devices[${i}][brand]" id="brand${i}" required>
        <option value="Samsung">Samsung</option>
        <option value="Apple">Apple</option>
      </select><br><br>
      
      <label for="model${i}">Device Model:</label>
      <input type="text" name="devices[${i}][model]" id="model${i}" required><br><br>
      
      <label for="storage${i}">Storage:</label>
      <select name="devices[${i}][storage]" id="storage${i}" required>
        <option value="64">64</option>
        <option value="128">128</option>
        <option value="256">256</option>
        <option value="512">512</option>
        <option value="1TB">1TB</option>
      </select><br><br>
      
      <label for="imei${i}">IMEI/Serial Number:</label>
      <input type="text" name="devices[${i}][imei]" id="imei${i}" required><br><br>
      
      <label for="color${i}">Color:</label>
      <input type="text" name="devices[${i}][color]" id="color${i}" required><br><br>
    `;
    container.appendChild(deviceForm);
  }
});

document.getElementById('numberOfScreens').addEventListener('input', function () {
  const numberOfScreens = this.value;
  const container = document.getElementById('screensContainer');
  container.innerHTML = '';

  for (let i = 0; i < numberOfScreens; i++) {
    const screenForm = document.createElement('div');
    screenForm.classList.add('device-box');
    screenForm.innerHTML = `
      <h3>Screen ${i + 1}</h3>
      <label for="screenModel${i}">Model:</label>
      <input type="text" name="screens[${i}][model]" id="screenModel${i}" required><br><br>
      
      <label for="quantity${i}">Quantity:</label>
      <input type="number" name="screens[${i}][quantity]" id="quantity${i}" required><br><br>
    `;
    container.appendChild(screenForm);
  }
});

document.getElementById('deviceForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const formData = new FormData(this);
  const sendingType = formData.get('sendingType');
  const formObject = {
    customerName: formData.get('customerName'),
    trackingNumber: formData.get('trackingNumber'),
    dateAccepted: formData.get('dateAccepted'),
    sendingType: sendingType,
    devices: [],
    screens: []
  };

  if (sendingType === 'devices') {
    const numberOfDevices = formData.get('numberOfDevices');
    formObject.numberOfDevices = numberOfDevices;
    for (let i = 0; i < numberOfDevices; i++) {
      const device = {
        brand: formData.get(`devices[${i}][brand]`),
        model: formData.get(`devices[${i}][model]`),
        storage: formData.get(`devices[${i}][storage]`),
        imei: formData.get(`devices[${i}][imei]`),
        color: formData.get(`devices[${i}][color]`)
      };
      formObject.devices.push(device);
    }
  } else if (sendingType === 'screens') {
    const numberOfScreens = formData.get('numberOfScreens');
    formObject.numberOfScreens = numberOfScreens;
    for (let i = 0; i < numberOfScreens; i++) {
      const screen = {
        model: formData.get(`screens[${i}][model]`),
        quantity: formData.get(`screens[${i}][quantity]`)
      };
      formObject.screens.push(screen);
    }
  }

  fetch(this.action, {
    method: this.method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formObject)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const url = new URL(sendingType === 'devices' ? '/device/success' : '/device/success_screen', window.location.origin);
      url.searchParams.append('results', JSON.stringify(data.results));
      window.location.href = url;
    } else {
      console.error(data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
});
