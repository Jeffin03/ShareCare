import { logOut } from "./auth.js";

/**
 * ui.js — Centralized UI components for ShareCare
 */

export function initAppShell(profile) {
  renderSidebar(profile);
  renderTopbar(profile);
  setupLogout();
}

function renderSidebar(profile) {
  const sidebar = document.querySelector('.sc-sidebar');
  if (!sidebar) return;

  const role = profile.role || 'patient';
  const isPatient = role === 'patient';
  const isPharmacy = role === 'pharmacy';

  // Determine current page for active state
  const path = window.location.pathname;
  const isDashboard = path.includes('dashboard.html');
  const isNewRequest = path.includes('new-request.html');
  const isFeed = path.includes('feed.html');
  const isNewPost = path.includes('new-post.html');

  sidebar.innerHTML = `
    <a href="/" class="sc-logo"><i class="ri-heart-pulse-fill"></i> ShareCare</a>
    
    <div class="sc-sidebar-section">${isPharmacy ? 'Pharmacy' : 'Medicine'}</div>
    <ul class="sc-sidebar-menu">
      ${isPharmacy ? `
        <li><a href="/pharmacy/dashboard.html" class="sc-sidebar-item ${isDashboard ? 'active' : ''}"><i class="ri-dashboard-line"></i> All Orders</a></li>
      ` : `
        <li><a href="/patient/dashboard.html" class="sc-sidebar-item ${isDashboard ? 'active' : ''}"><i class="ri-file-list-3-line"></i> My Requests</a></li>
        <li><a href="/patient/new-request.html" class="sc-sidebar-item ${isNewRequest ? 'active' : ''}"><i class="ri-add-circle-line"></i> New Request</a></li>
      `}
    </ul>

    <div class="sc-sidebar-section">Community</div>
    <ul class="sc-sidebar-menu">
      <li><a href="/community/feed.html" class="sc-sidebar-item ${isFeed && !path.includes('saved') ? 'active' : ''}"><i class="ri-home-smile-2-line"></i> Feed</a></li>
      <li><a href="/community/new-post.html" class="sc-sidebar-item ${isNewPost ? 'active' : ''}"><i class="ri-edit-line"></i> New Post</a></li>
      <li><a href="/community/feed.html?view=saved" class="sc-sidebar-item ${path.includes('saved') ? 'active' : ''}"><i class="ri-bookmark-3-line"></i> Saved</a></li>
    </ul>

    <div class="sc-sidebar-footer">
      <div class="sc-user-chip">
        <div class="sc-user-avatar">${(profile.name || 'U')[0].toUpperCase()}</div>
        <div class="sc-user-info">
          <div class="sc-user-name">${profile.name || 'User'}</div>
          <div class="sc-user-role">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
        </div>
        <i class="ri-logout-box-r-line sc-logout" title="Sign out"></i>
      </div>
    </div>
  `;

  // Fix Logo link to point to dashboard if logged in
  const logo = sidebar.querySelector('.sc-logo');
  if (logo) {
    logo.href = isPharmacy ? '/pharmacy/dashboard.html' : '/patient/dashboard.html';
  }
}

function renderTopbar(profile) {
  const topbar = document.querySelector('.sc-topbar');
  if (!topbar) return;

  const role = profile.role || 'patient';
  const isPatient = role === 'patient';
  const path = window.location.pathname;

  // Extract title from page or meta
  const title = document.title.split('—')[1]?.trim() || 'Dashboard';
  const sub = getTopbarSub(title, role);

  const isDetail = path.includes('detail.html') || path.includes('new-request.html') || path.includes('new-post.html');
  const backBtnHTML = isDetail 
    ? `<a href="javascript:history.back()" class="btn btn-outline btn-sm" style="margin-right: 16px; border: none; padding: 6px 12px;"><i class="ri-arrow-left-line"></i> Back</a>` 
    : '';

  topbar.innerHTML = `
    <div class="sc-topbar-left" style="display: flex; align-items: center;">
      ${backBtnHTML}
      <div>
        <div class="sc-topbar-title">${title}</div>
        <div class="sc-topbar-sub">${sub}</div>
      </div>
    </div>
    <div class="sc-topbar-right">
      <div class="notif-btn"><i class="ri-notification-3-line"></i><div class="notif-dot" style="display:none;"></div></div>
      ${isPatient && !isDetail ? `<a href="/patient/new-request.html" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> New Request</a>` : ''}
    </div>
  `;
}

function getTopbarSub(title, role) {
  if (title.includes('Requests')) return 'Track your medicine restock requests';
  if (title.includes('Orders')) return 'All incoming medicine requests';
  if (title.includes('Feed')) return 'Recipes, tips & support from the community';
  if (title.includes('New Request')) return 'Send a restock request to your pharmacy';
  if (title.includes('New Post')) return 'Share your experience with others';
  return 'Welcome back to ShareCare';
}

function setupLogout() {
  const logoutBtn = document.querySelector('.sc-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out?')) {
        await logOut();
      }
    });
  }
}


