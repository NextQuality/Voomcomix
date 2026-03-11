// ============================================
// VOOMCOMIX — SUPABASE CONFIG
// ============================================

const SUPABASE_URL = 'https://gcpbvzyndmwdlvopftma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcGJ2enluZG13ZGx2b3BmdG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ0MzcsImV4cCI6MjA4ODgwMDQzN30.pqv_VcOxGrpxPfQXAaey_wF85yiC0hgNDJBD6f7MyXk';

// Supabase client — loaded from CDN in each HTML file
// const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSupabase() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function getCurrentUser() {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getCurrentProfile() {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

async function requireAuth(redirectTo = 'login.html') {
  const user = await getCurrentUser();
  if (!user) { window.location.href = redirectTo; return null; }
  return user;
}

async function requireWriter() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'writer') {
    window.location.href = 'become-writer.html';
    return null;
  }
  return profile;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = 'index.html';
    return null;
  }
  return profile;
}

// Upload image to Supabase storage
async function uploadImage(file, bucket, path) {
  const sb = getSupabase();
  const ext = file.name.split('.').pop();
  const fileName = `${path}-${Date.now()}.${ext}`;
  const { data, error } = await sb.storage.from(bucket).upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(fileName);
  return urlData.publicUrl;
}

// Format numbers
function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n?.toString() || '0';
}

// Time ago
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff/60000);
  const hrs = Math.floor(diff/3600000);
  const days = Math.floor(diff/86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN');
}

// Toast notification
function showToast(msg, type = 'success') {
  let t = document.getElementById('vc-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vc-toast';
    t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
    padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;z-index:9999;
    opacity:0;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,.2);white-space:nowrap;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#059669';
  t.style.color = '#fff';
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 3000);
}

// Navbar auth state
async function initNavAuth() {
  const sb = getSupabase();
  const user = await getCurrentUser();
  const authBtns = document.getElementById('nav-auth');
  const userMenu = document.getElementById('nav-user');
  if (!authBtns && !userMenu) return;

  if (user) {
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (authBtns) authBtns.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const nameEl = document.getElementById('nav-username');
      if (nameEl) nameEl.textContent = profile?.display_name || profile?.username || 'User';
      // Show writer dashboard link if writer
      const writerLink = document.getElementById('nav-writer-link');
      if (writerLink && (profile?.role === 'writer' || profile?.role === 'admin')) {
        writerLink.style.display = 'block';
      }
      const adminLink = document.getElementById('nav-admin-link');
      if (adminLink && profile?.role === 'admin') {
        adminLink.style.display = 'block';
      }
    }
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

async function navLogout() {
  const sb = getSupabase();
  await sb.auth.signOut();
  window.location.href = 'index.html';
}
