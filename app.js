// Storage Keys
const STORAGE_KEY = 'CIVIC_CARE_COMPLAINTS';
const AUTH_KEY = 'CIVIC_CARE_ADMIN_AUTH';

// Hardcoded Admin Credentials
const ADMIN_CREDENTIALS = {
  user: 'admin',
  pass: 'admin123'
};

// Seed initial sample data if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const sampleData = [
      {
        id: 'TKT-1001',
        date: '2026-09-24',
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        phone: '9823012345',
        category: 'Roads & Potholes',
        priority: 'Critical',
        coordinates: '21.1458, 79.0882',
        address: 'Wardha Road, near Metro Pillar 42',
        description: 'Massive pothole causing severe traffic slowdown and motorcycle skids.',
        photo: '',
        status: 'Processing',
        feedback: 'Junior engineer dispatched to measure asphalt fill requirement.'
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
  }
}

function getComplaints() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveComplaints(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderAdminList();
  updateMetrics();
}

// Check if Admin is currently logged in
function isAdminLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

// Tab Navigation
function switchTab(tab) {
  // Hide all sections
  ['sectionFile', 'sectionTrack', 'sectionAdminLogin', 'sectionAdminDashboard'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  // Reset navbar buttons
  ['btnTabFile', 'btnTabTrack', 'btnTabAdmin'].forEach(id => {
    document.getElementById(id).classList.remove('bg-white', 'text-indigo-700');
    document.getElementById(id).classList.add('text-white');
  });

  if (tab === 'file') {
    document.getElementById('sectionFile').classList.remove('hidden');
    document.getElementById('btnTabFile').classList.add('bg-white', 'text-indigo-700');
  } else if (tab === 'track') {
    document.getElementById('sectionTrack').classList.remove('hidden');
    document.getElementById('btnTabTrack').classList.add('bg-white', 'text-indigo-700');
  } else if (tab === 'admin') {
    document.getElementById('btnTabAdmin').classList.add('bg-white', 'text-indigo-700');
    // Guard check: Show login or dashboard depending on auth
    if (isAdminLoggedIn()) {
      document.getElementById('sectionAdminDashboard').classList.remove('hidden');
      renderAdminList();
      updateMetrics();
    } else {
      document.getElementById('sectionAdminLogin').classList.remove('hidden');
    }
  }
}

// Admin Authentication Handlers
function handleAdminLogin(e) {
  e.preventDefault();
  const enteredUser = document.getElementById('adminUser').value.trim();
  const enteredPass = document.getElementById('adminPass').value.trim();
  const errorMsg = document.getElementById('loginError');

  if (enteredUser === ADMIN_CREDENTIALS.user && enteredPass === ADMIN_CREDENTIALS.pass) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    errorMsg.classList.add('hidden');
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
    switchTab('admin');
  } else {
    errorMsg.classList.remove('hidden');
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  switchTab('admin');
}

// Geolocation Hardware API Integration
function detectGPSLocation() {
  const geoStatus = document.getElementById('geoStatus');
  const coordsInput = document.getElementById('gpsCoordinates');

  if (!navigator.geolocation) {
    geoStatus.textContent = "Geolocation is not supported by your browser.";
    return;
  }

  geoStatus.textContent = "Fetching coordinates from GPS hardware...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);
      coordsInput.value = `${lat}, ${lng}`;
      geoStatus.textContent = "Coordinates locked successfully!";
      geoStatus.classList.remove('text-red-500');
      geoStatus.classList.add('text-emerald-600');
    },
    (error) => {
      geoStatus.textContent = "Unable to fetch location: " + error.message;
      geoStatus.classList.add('text-red-500');
    }
  );
}

// Photo Upload Preview Handler
let currentPhotoBase64 = '';
function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentPhotoBase64 = e.target.result;
      document.getElementById('imagePreview').src = currentPhotoBase64;
      document.getElementById('imagePreviewContainer').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  currentPhotoBase64 = '';
  document.getElementById('complaintPhoto').value = '';
  document.getElementById('imagePreviewContainer').classList.add('hidden');
}

// Grievance Form Submission
function handleFormSubmit(e) {
  e.preventDefault();

  const newId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
  const newComplaint = {
    id: newId,
    date: new Date().toISOString().split('T')[0],
    name: document.getElementById('citizenName').value.trim(),
    email: document.getElementById('citizenEmail').value.trim(),
    phone: document.getElementById('citizenPhone').value.trim(),
    category: document.getElementById('complaintCategory').value,
    priority: document.getElementById('complaintPriority').value,
    coordinates: document.getElementById('gpsCoordinates').value,
    address: document.getElementById('addressManual').value.trim(),
    description: document.getElementById('complaintDesc').value.trim(),
    photo: currentPhotoBase64,
    status: 'Pending',
    feedback: 'Your grievance has been forwarded to the designated zonal supervisor.'
  };

  const list = getComplaints();
  list.unshift(newComplaint);
  saveComplaints(list);

  alert(`Grievance submitted successfully!\n\nYour Tracking Ticket ID is: ${newId}\nPlease save this ID for reference.`);
  document.getElementById('grievanceForm').reset();
  removeImage();
  document.getElementById('geoStatus').textContent = '';

  // Redirect to track page automatically
  document.getElementById('trackSearchInput').value = newId;
  switchTab('track');
  trackComplaint();
}

// Search and Track Grievance Progress
function trackComplaint() {
  const query = document.getElementById('trackSearchInput').value.trim().toLowerCase();
  const container = document.getElementById('trackResultContainer');
  container.innerHTML = '';
  container.classList.remove('hidden');

  if (!query) {
    container.innerHTML = `<p class="text-sm text-red-500">Please provide a Ticket ID or Mobile Number.</p>`;
    return;
  }

  const list = getComplaints();
  const results = list.filter(item => 
    item.id.toLowerCase() === query || item.phone.toLowerCase() === query
  );

  if (results.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-500">
        <i class="fa-solid fa-circle-question text-3xl mb-2 text-slate-300"></i>
        <p>No complaint found with details matching "${query}".</p>
      </div>
    `;
    return;
  }

  results.forEach(item => {
    const stepPending = item.status === 'Pending' || item.status === 'Processing' || item.status === 'Completed';
    const stepProc = item.status === 'Processing' || item.status === 'Completed';
    const stepComp = item.status === 'Completed';

    const card = document.createElement('div');
    card.className = "border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-5";
    card.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-3">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">${item.id}</span>
          <span class="text-xs text-slate-400 ml-2">Filed: ${item.date}</span>
        </div>
        <span class="text-xs font-bold px-3 py-1 rounded-full ${
          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
          item.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
        }">${item.status}</span>
      </div>

      <!-- 3-Stage Progress Stepper -->
      <div class="flex justify-between items-center text-xs font-semibold px-2 sm:px-8">
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${stepPending ? 'bg-indigo-600 text-white' : 'bg-slate-200'}">1</div>
          <span class="mt-1">Pending</span>
        </div>
        <div class="flex-1 h-1 mx-2 ${stepProc ? 'bg-indigo-600' : 'bg-slate-200'}"></div>
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${stepProc ? 'bg-indigo-600 text-white' : 'bg-slate-200'}">2</div>
          <span class="mt-1">Processing</span>
        </div>
        <div class="flex-1 h-1 mx-2 ${stepComp ? 'bg-emerald-600' : 'bg-slate-200'}"></div>
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${stepComp ? 'bg-emerald-600 text-white' : 'bg-slate-200'}">3</div>
          <span class="mt-1">Completed</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
        <div>
          <p class="text-xs text-slate-400">Issue Category</p>
          <p class="font-medium text-slate-800">${item.category}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Location</p>
          <p class="font-medium text-slate-800">${item.address} <span class="text-xs text-indigo-500">(${item.coordinates})</span></p>
        </div>
        <div class="sm:col-span-2">
          <p class="text-xs text-slate-400">Description</p>
          <p class="text-slate-700">${item.description}</p>
        </div>
        ${item.photo ? `
        <div class="sm:col-span-2">
          <p class="text-xs text-slate-400 mb-1">Attached Photo</p>
          <img src="${item.photo}" class="w-48 h-32 object-cover rounded-lg border border-slate-200" />
        </div>` : ''}
        <div class="sm:col-span-2 p-3 bg-white rounded-lg border border-indigo-100">
          <p class="text-xs font-bold text-indigo-700 mb-1"><i class="fa-solid fa-comment-dots mr-1"></i> Admin Feedback / Updates:</p>
          <p class="text-slate-700 italic">${item.feedback || 'No remarks provided yet.'}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Update Top Level Metrics in Admin Panel
function updateMetrics() {
  const list = getComplaints();
  document.getElementById('statTotal').textContent = list.length;
  document.getElementById('statPending').textContent = list.filter(i => i.status === 'Pending').length;
  document.getElementById('statProcessing').textContent = list.filter(i => i.status === 'Processing').length;
  document.getElementById('statCompleted').textContent = list.filter(i => i.status === 'Completed').length;
}

// Render Admin Grievances Table
function renderAdminList() {
  const filter = document.getElementById('adminStatusFilter').value;
  const list = getComplaints();
  const filtered = filter === 'ALL' ? list : list.filter(i => i.status === filter);
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">No grievances in this filter.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement('tr');
    row.className = "hover:bg-slate-50 transition border-b";
    row.innerHTML = `
      <td class="px-4 py-3">
        <span class="font-bold text-indigo-600">${item.id}</span>
        <div class="text-xs text-slate-400">${item.date}</div>
      </td>
      <td class="px-4 py-3">
        <div class="font-medium text-slate-800">${item.name}</div>
        <div class="text-xs text-slate-500">${item.phone}</div>
      </td>
      <td class="px-4 py-3">
        <div class="font-medium text-slate-700">${item.category}</div>
        <div class="text-xs text-slate-400 truncate max-w-xs">${item.address}</div>
      </td>
      <td class="px-4 py-3">
        <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${
          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
          item.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
        }">${item.status}</span>
      </td>
      <td class="px-4 py-3 text-right">
        <button onclick="openAdminModal('${item.id}')" class="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200">
          Manage
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Modal Actions for Admin
function openAdminModal(ticketId) {
  const list = getComplaints();
  const comp = list.find(i => i.id === ticketId);
  if (!comp) return;

  document.getElementById('modalTicketId').value = comp.id;
  document.getElementById('modalStatusSelect').value = comp.status;
  document.getElementById('modalFeedback').value = comp.feedback || '';
  document.getElementById('adminModal').classList.remove('hidden');
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.add('hidden');
}

function saveAdminChanges() {
  const ticketId = document.getElementById('modalTicketId').value;
  const status = document.getElementById('modalStatusSelect').value;
  const feedback = document.getElementById('modalFeedback').value.trim();

  const list = getComplaints();
  const idx = list.findIndex(i => i.id === ticketId);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].feedback = feedback;
    saveComplaints(list);
  }
  closeAdminModal();
}

// Run storage check on page load
initializeStorage();