// Initialize sample data if none exists
if (!localStorage.getItem('reports')) {
  const sample = [
    {
      id: Date.now()+1,
      name:'Sample A',
      place:'Kochi',
      district:'Ernakulam',
      category:'Plastic',
      desc:'Plastic bottles piled up.',
      photoUrl:'https://via.placeholder.com/100x80?text=Plastic',
      loc:[10.0159,76.3419],
      priority:'red',
      status:'Not Done'
    },
    {
      id: Date.now()+2,
      name:'Sample B',
      place:'Thrissur',
      district:'Thrissur',
      category:'Organic',
      desc:'Organic waste near market.',
      photoUrl:'https://via.placeholder.com/100x80?text=Organic',
      loc:[10.5276,76.2144],
      priority:'yellow',
      status:'In Progress'
    }
  ];
  localStorage.setItem('reports', JSON.stringify(sample));
}

// Utility: get all reports
function getReports() {
  return JSON.parse(localStorage.getItem('reports')||'[]');
}

// Save reports back
function saveReports(arr) {
  localStorage.setItem('reports', JSON.stringify(arr));
}

// 1) LOGIN FORM
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.onsubmit = e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    localStorage.setItem('userEmail', email);
    window.location='report.html';
  };
}

// 2) REGISTRATION FORM
const regForm = document.getElementById('regForm');
if (regForm) {
  regForm.onsubmit = e => {
    e.preventDefault();
    // Save volunteer details if needed
    window.location='report.html';
  };
}

// 3) REPORT FORM: camera, GPS, storage
const reportForm = document.getElementById('reportForm');
if (reportForm) {
  // get GPS
  navigator.geolocation.getCurrentPosition(p => {
    document.getElementById('location')
      .innerText = `Location: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;
    reportForm.dataset.lat = p.coords.latitude;
    reportForm.dataset.lon = p.coords.longitude;
  });

  reportForm.onsubmit = e => {
    e.preventDefault();
    const id = Date.now();
    const name = document.getElementById('repName').value;
    const place = document.getElementById('repPlace').value;
    const district = document.getElementById('repDistrict').value;
    const category = document.getElementById('repCategory').value;
    const desc = document.getElementById('repDesc').value;
    const photoFile = document.getElementById('repPhoto').files[0];
    const photoUrl = URL.createObjectURL(photoFile);
    const lat = +reportForm.dataset.lat;
    const lon = +reportForm.dataset.lon;
    // set priority
    let priority = 'green';
    if (category==='Plastic') priority='red';
    if (category==='Organic') priority='yellow';
    const rep = { id, name, place, district, category, desc, photoUrl, loc:[lat,lon], priority, status:'Not Done' };
    const arr = getReports();
    arr.push(rep);
    saveReports(arr);
    window.location='map.html';
  };
}

// 4) MAP INIT
function initMap() {
  const map = L.map('map').setView([10.5276,76.2144], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap contributors'
  }).addTo(map);

  getReports().forEach(r => {
    const icon = L.icon({
      iconUrl:`assets/${r.priority}-pin.png`,
      iconSize:[30,50]
    });
    L.marker(r.loc, { icon })
     .addTo(map)
     .bindPopup(`<strong>${r.category}</strong><br>
                 <img src="${r.photoUrl}" width="100"><br>
                 ${r.desc}<br>
                 <em>${r.place}, ${r.district}</em><br>
                 Status: ${r.status}`);
  });
}
if (document.getElementById('map')) initMap();

// 5) FILTER PAGE
function renderFiltered() {
  const cat = document.getElementById('filterCat').value;
  const list = document.getElementById('filterList');
  list.innerHTML = '';
  getReports()
    .filter(r => cat==='all' ? true : r.category===cat)
    .forEach(r => {
      const li = document.createElement('li');
      li.textContent = `[${r.id}] ${r.category} – ${r.place}, ${r.district}`;
      list.appendChild(li);
    });
}
if (document.getElementById('filterList')) renderFiltered();

// 6) STATUS UPDATE
const statusForm = document.getElementById('statusForm');
if (statusForm) {
  statusForm.onsubmit = e => {
    e.preventDefault();
    const id = +document.getElementById('statusId').value;
    const st = document.getElementById('statusVal').value;
    const arr = getReports();
    const idx = arr.findIndex(r => r.id===id);
    if (idx>=0) {
      arr[idx].status = st;
      saveReports(arr);
      alert('Status updated.');
    } else alert('Report not found.');
  };
}
