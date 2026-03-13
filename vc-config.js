// ============================================
// VOOMCOMIX — SUPABASE CONFIG
// v2.0 — Single shared client, stable auth
// ============================================

const SUPABASE_URL = 'https://gcpbvzyndmwdlvopftma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcGJ2enluZG13ZGx2b3BmdG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ0MzcsImV4cCI6MjA4ODgwMDQzN30.pqv_VcOxGrpxPfQXAaey_wF85yiC0hgNDJBD6f7MyXk';

// ── Single shared Supabase client (do NOT call createClient multiple times) ──
let _sb = null;
function getSupabase() {
  if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return _sb;
}

// ── Shorthand ──
const sb = () => getSupabase();

// ============================================
// AUTH HELPERS
// ============================================

async function getCurrentUser() {
  const { data: { user } } = await sb().auth.getUser();
  return user || null;
}

async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await sb()
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) return null;
  return data;
}

// Redirect to login if not logged in
async function requireAuth(redirectTo = 'login.html') {
  const user = await getCurrentUser();
  if (!user) { window.location.href = redirectTo; return null; }
  return user;
}

// Redirect to login if not writer or admin
async function requireWriter() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'writer' && profile.role !== 'admin')) {
    window.location.href = 'login.html';
    return null;
  }
  return profile;
}

// Redirect to homepage if not admin
async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = 'index.html';
    return null;
  }
  return profile;
}

// ============================================
// STORAGE — IMAGE UPLOAD
// ============================================

async function uploadImage(file, bucket, pathPrefix) {
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${pathPrefix}-${Date.now()}.${ext}`;
  const { error } = await sb().storage
    .from(bucket)
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) throw new Error('Upload failed: ' + error.message);
  const { data: urlData } = sb().storage.from(bucket).getPublicUrl(fileName);
  return urlData.publicUrl;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN');
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(msg, type = 'success') {
  let t = document.getElementById('vc-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vc-toast';
    t.style.cssText = [
      'position:fixed', 'bottom:28px', 'left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'padding:12px 28px', 'border-radius:8px',
      'font-family:Rajdhani,sans-serif', 'font-weight:700',
      'font-size:15px', 'z-index:99999',
      'opacity:0', 'transition:all .3s',
      'box-shadow:0 4px 24px rgba(0,0,0,.25)',
      'white-space:nowrap', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(t);
  }
  const colors = { success: '#059669', error: '#dc2626', warning: '#d97706', info: '#2563eb' };
  t.textContent = msg;
  t.style.background = colors[type] || colors.success;
  t.style.color = '#fff';
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3500);
}

// ============================================
// NAVBAR AUTH STATE
// ============================================

async function initNavAuth() {
  const user = await getCurrentUser();
  const authBtns = document.getElementById('nav-auth');
  const userMenu = document.getElementById('nav-user');
  if (!authBtns && !userMenu) return;

  if (user) {
    const profile = await getCurrentProfile();
    if (authBtns) authBtns.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const nameEl = document.getElementById('nav-username');
      if (nameEl) nameEl.textContent = profile?.display_name || profile?.username || 'User';
      const writerLink = document.getElementById('nav-writer-link');
      if (writerLink && (profile?.role === 'writer' || profile?.role === 'admin'))
        writerLink.style.display = 'block';
      const adminLink = document.getElementById('nav-admin-link');
      if (adminLink && profile?.role === 'admin')
        adminLink.style.display = 'block';
    }
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

async function navLogout() {
  await sb().auth.signOut();
  window.location.href = 'index.html';
}
