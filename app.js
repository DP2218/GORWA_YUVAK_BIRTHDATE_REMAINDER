/**
 * Gorwa Yuvak Birthday Dashboard & Reminder
 * Application Logic, State Management & Modern UI Handlers
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. Constants & Configuration
  // ==========================================================================
  const STORAGE_KEY = 'gorwa_yuvak_birthdays_v1';
  const THEME_KEY = 'gorwa_theme_preference';

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const ZODIAC_SIGNS = [
    { name: "Capricorn ♑", start: [1, 1], end: [1, 19] },
    { name: "Aquarius ♒", start: [1, 20], end: [2, 18] },
    { name: "Pisces ♓", start: [2, 19], end: [3, 20] },
    { name: "Aries ♈", start: [3, 21], end: [4, 19] },
    { name: "Taurus ♉", start: [4, 20], end: [5, 20] },
    { name: "Gemini ♊", start: [5, 21], end: [6, 20] },
    { name: "Cancer ♋", start: [6, 21], end: [7, 22] },
    { name: "Leo ♌", start: [7, 23], end: [8, 22] },
    { name: "Virgo ♍", start: [8, 23], end: [9, 22] },
    { name: "Libra ♎", start: [9, 23], end: [10, 22] },
    { name: "Scorpio ♏", start: [10, 23], end: [11, 21] },
    { name: "Sagittarius ♐", start: [11, 22], end: [12, 21] },
    { name: "Capricorn ♑", start: [12, 22], end: [12, 31] }
  ];

  // ==========================================================================
  // 2. Application State
  // ==========================================================================
  const state = {
    yuvaks: [],
    selectedMonth: 'All', // 'All' or 'January', 'February', etc.
    activeFilter: 'all',  // 'all' | 'today' | 'upcoming7' | 'current-month'
    searchQuery: '',
    sortOption: 'day-asc', // 'day-asc' | 'day-desc' | 'upcoming' | 'name-asc' | 'name-desc'
    activeView: 'grid',    // 'grid' | 'table' | 'calendar'
    activeRecipient: null,
    pendingImportData: null
  };

  // ==========================================================================
  // 3. Helper Functions & Date Calculations
  // ==========================================================================
  
  /**
   * Returns current local Date instance.
   */
  function getCurrentDate() {
    return new Date();
  }

  /**
   * Calculates days remaining until the next birthday.
   * 0 = Today, 1 = Tomorrow, etc.
   */
  function getDaysUntilBirthday(monthNum, dayNum) {
    const today = getCurrentDate();
    const currentYear = today.getFullYear();
    const todayMidnight = new Date(currentYear, today.getMonth(), today.getDate());

    let nextBirthday = new Date(currentYear, monthNum - 1, dayNum);

    // If birthday has already occurred this year, check next year
    if (nextBirthday < todayMidnight) {
      nextBirthday = new Date(currentYear + 1, monthNum - 1, dayNum);
    }

    const diffTime = nextBirthday - todayMidnight;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates age that the person is turning on their next birthday.
   */
  function calculateTurningAge(birthYear, monthNum, dayNum) {
    if (!birthYear || birthYear < 1920) return null;
    const today = getCurrentDate();
    let nextYear = today.getFullYear();
    const bdayThisYear = new Date(nextYear, monthNum - 1, dayNum);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (bdayThisYear < todayMidnight) {
      nextYear += 1;
    }
    return nextYear - birthYear;
  }

  /**
   * Returns astrological zodiac sign.
   */
  function getZodiac(monthNum, dayNum) {
    for (const z of ZODIAC_SIGNS) {
      const [sm, sd] = z.start;
      const [em, ed] = z.end;
      if (
        (monthNum === sm && dayNum >= sd) ||
        (monthNum === em && dayNum <= ed)
      ) {
        return z.name;
      }
    }
    return "Capricorn ♑";
  }

  /**
   * Extracts initials from name (e.g. PATEL ARTH -> PA).
   */
  function getInitials(name) {
    if (!name) return 'YU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  /**
   * Formats a raw phone number into +91 XXXXX XXXXX and raw wa string
   */
  function formatContact(raw) {
    if (!raw) return { wa: '', display: 'N/A' };
    const digits = String(raw).replace(/\D/g, '');
    let wa = digits;
    if (digits.length === 10) {
      wa = '91' + digits;
    } else if (digits.length > 10 && !digits.startsWith('91')) {
      wa = '91' + digits;
    }

    let display = wa;
    if (wa.startsWith('91') && wa.length === 12) {
      display = `+91 ${wa.substring(2, 7)} ${wa.substring(7)}`;
    }
    return { wa, display };
  }

  // ==========================================================================
  // 4. Data Loading & Persistence
  // ==========================================================================

  function loadInitialData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.yuvaks = parsed;
          return;
        }
      } catch (e) {
        console.error('Error loading stored yuvak data:', e);
      }
    }

    // Default to the embedded dataset loaded from data.js
    if (typeof DEFAULT_YUVAK_DATA !== 'undefined' && Array.isArray(DEFAULT_YUVAK_DATA)) {
      state.yuvaks = JSON.parse(JSON.stringify(DEFAULT_YUVAK_DATA));
    } else {
      state.yuvaks = [];
    }
    saveData();
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.yuvaks));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
      showToast('⚠️ Storage limit reached or localStorage unavailable.', 'warning');
    }
  }

  function resetToDefault() {
    if (!confirm('Are you sure you want to reset all records back to the original Excel dataset? Any custom additions or edits will be restored.')) {
      return;
    }
    if (typeof DEFAULT_YUVAK_DATA !== 'undefined') {
      state.yuvaks = JSON.parse(JSON.stringify(DEFAULT_YUVAK_DATA));
      saveData();
      refreshUI();
      showToast('🔄 Database successfully restored to original Excel file!', 'success');
    }
  }

  // ==========================================================================
  // 5. Toast Notifications & Confetti
  // ==========================================================================

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function launchConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }

  // ==========================================================================
  // 6. UI Renderers
  // ==========================================================================

  /**
   * Live Clock Updater
   */
  function initLiveClock() {
    const clockEl = document.getElementById('clockText');
    const update = () => {
      const now = getCurrentDate();
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      const dateStr = now.toLocaleDateString('en-GB', options);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (clockEl) {
        clockEl.textContent = `${dateStr} • ${timeStr}`;
      }
    };
    update();
    setInterval(update, 1000);
  }

  /**
   * Render Month Dropdown & Synced Quick Pills with dynamic counts
   */
  function renderMonthCarousel() {
    const monthSelect = document.getElementById('monthSelect');
    const filterTypeSelect = document.getElementById('filterTypeSelect');
    const carousel = document.getElementById('monthCarousel');

    // 1. Populate Month Dropdown
    if (monthSelect) {
      const currentSelected = state.selectedMonth;
      monthSelect.innerHTML = '';

      const allOpt = document.createElement('option');
      allOpt.value = 'All';
      allOpt.textContent = `🌟 All Months (${state.yuvaks.length} Members)`;
      monthSelect.appendChild(allOpt);

      MONTH_NAMES.forEach((month, idx) => {
        const count = state.yuvaks.filter(y => y.month === month || y.monthNum === idx + 1).length;
        const opt = document.createElement('option');
        opt.value = month;
        opt.textContent = `📅 ${month} (${count} Birthdays)`;
        monthSelect.appendChild(opt);
      });

      monthSelect.value = currentSelected;
    }

    // 2. Sync Filter Type Dropdown
    if (filterTypeSelect) {
      filterTypeSelect.value = state.activeFilter;
    }

    // 3. Render Synced Quick Pills (no scrollbar)
    if (carousel) {
      carousel.innerHTML = '';

      // "All Records" Chip
      const allChip = document.createElement('button');
      allChip.className = `month-chip ${state.selectedMonth === 'All' ? 'active' : ''}`;
      allChip.innerHTML = `🌟 All Months <span class="month-badge-count">${state.yuvaks.length}</span>`;
      allChip.addEventListener('click', () => {
        state.selectedMonth = 'All';
        if (monthSelect) monthSelect.value = 'All';
        refreshUI();
      });
      carousel.appendChild(allChip);

      // 12 Months
      MONTH_NAMES.forEach((month, idx) => {
        const count = state.yuvaks.filter(y => y.month === month || y.monthNum === idx + 1).length;
        const chip = document.createElement('button');
        chip.className = `month-chip ${state.selectedMonth === month ? 'active' : ''}`;
        chip.innerHTML = `${month} <span class="month-badge-count">${count}</span>`;
        
        chip.addEventListener('click', () => {
          state.selectedMonth = month;
          if (monthSelect) monthSelect.value = month;
          refreshUI();
        });
        carousel.appendChild(chip);
      });
    }
  }

  /**
   * Spotlight Hero Banner: Celebrates today's birthdays or upcoming 7 days
   */
  function renderSpotlightBanner() {
    const banner = document.getElementById('spotlightBanner');
    const headline = document.getElementById('spotlightHeadline');
    const badge = document.getElementById('spotlightBadge');
    const cardsContainer = document.getElementById('spotlightCards');
    if (!banner || !cardsContainer) return;

    cardsContainer.innerHTML = '';

    // Find today's birthdays
    const todays = state.yuvaks.filter(y => getDaysUntilBirthday(y.monthNum, y.day) === 0);
    // Find upcoming in next 7 days
    const upcoming = state.yuvaks
      .filter(y => {
        const d = getDaysUntilBirthday(y.monthNum, y.day);
        return d > 0 && d <= 7;
      })
      .sort((a, b) => getDaysUntilBirthday(a.monthNum, a.day) - getDaysUntilBirthday(b.monthNum, b.day));

    if (todays.length > 0) {
      badge.textContent = '🎉 TODAY!';
      badge.style.background = 'var(--gold-gradient)';
      headline.innerHTML = `Birthday Stars Today (${todays.length}) — Send Your Blessings!`;

      todays.forEach(yuvak => {
        cardsContainer.appendChild(createSpotlightCard(yuvak, true));
      });
    } else if (upcoming.length > 0) {
      badge.textContent = '⚡ UPCOMING';
      badge.style.background = 'var(--accent-gradient)';
      headline.innerHTML = `Upcoming Celebrations This Week (${upcoming.length}) — Get Ready to Wish!`;

      upcoming.slice(0, 4).forEach(yuvak => {
        cardsContainer.appendChild(createSpotlightCard(yuvak, false));
      });
    } else {
      // General next upcoming
      const nextUpcoming = [...state.yuvaks].sort((a, b) => 
        getDaysUntilBirthday(a.monthNum, a.day) - getDaysUntilBirthday(b.monthNum, b.day)
      ).slice(0, 3);

      badge.textContent = '🌟 NEXT CELEBRATIONS';
      headline.innerHTML = `Upcoming Birthdays`;
      nextUpcoming.forEach(yuvak => {
        cardsContainer.appendChild(createSpotlightCard(yuvak, false));
      });
    }
  }

  function createSpotlightCard(yuvak, isToday) {
    const card = document.createElement('div');
    card.className = `spotlight-card ${isToday ? 'is-today' : ''}`;

    const days = getDaysUntilBirthday(yuvak.monthNum, yuvak.day);
    let statusText = isToday ? '🎂 Today!' : (days === 1 ? '🎈 Tomorrow!' : `In ${days} days`);
    const waUrl = getWhatsAppLink(yuvak.name, yuvak.contact);

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="days-pill ${isToday ? 'today' : (days === 1 ? 'tomorrow' : 'upcoming')}">${statusText}</span>
        <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">📅 ${yuvak.formattedDate}</span>
      </div>
      <div>
        <div style="font-size:1.05rem; font-weight:700; color:var(--text-primary); margin-bottom:2px;">${escapeHtml(yuvak.name)}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">📞 ${yuvak.displayContact || yuvak.contact}</div>
      </div>
      <div class="card-actions" style="margin-top:6px;">
        <a href="tel:${yuvak.contact}" class="card-action-btn btn-call" title="Call ${escapeHtml(yuvak.name)}">
          📞 Call
        </a>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-wa" title="Wish on WhatsApp">
          💬 WhatsApp
        </a>
      </div>
    `;
    return card;
  }

  /**
   * Update Top KPI Cards
   */
  function updateKPIStats() {
    const totalEl = document.getElementById('statTotalYuvaks');
    const todayEl = document.getElementById('statTodayBirthdays');
    const weekEl = document.getElementById('statUpcomingWeek');
    const monthEl = document.getElementById('statMonthCount');
    const monthLabelEl = document.getElementById('statMonthLabel');

    const total = state.yuvaks.length;
    const todayCount = state.yuvaks.filter(y => getDaysUntilBirthday(y.monthNum, y.day) === 0).length;
    const weekCount = state.yuvaks.filter(y => {
      const d = getDaysUntilBirthday(y.monthNum, y.day);
      return d >= 0 && d <= 7;
    }).length;

    let monthTargetName = state.selectedMonth;
    if (monthTargetName === 'All') {
      const currentMonthIdx = getCurrentDate().getMonth();
      monthTargetName = MONTH_NAMES[currentMonthIdx];
    }
    const monthCount = state.yuvaks.filter(y => y.month === monthTargetName).length;

    if (totalEl) totalEl.textContent = total;
    if (todayEl) todayEl.textContent = todayCount;
    if (weekEl) weekEl.textContent = weekCount;
    if (monthEl) monthEl.textContent = monthCount;
    if (monthLabelEl) monthLabelEl.textContent = `${monthTargetName} Birthdays`;
  }

  /**
   * Filter and Sort Data Pipeline
   */
  function getFilteredAndSortedData() {
    let list = [...state.yuvaks];

    // 1. Month Filter
    if (state.selectedMonth !== 'All') {
      list = list.filter(y => y.month === state.selectedMonth);
    }

    // 2. Quick Filter
    if (state.activeFilter === 'today') {
      list = list.filter(y => getDaysUntilBirthday(y.monthNum, y.day) === 0);
    } else if (state.activeFilter === 'upcoming7') {
      list = list.filter(y => {
        const d = getDaysUntilBirthday(y.monthNum, y.day);
        return d >= 0 && d <= 7;
      });
    } else if (state.activeFilter === 'current-month') {
      const currentMonthName = MONTH_NAMES[getCurrentDate().getMonth()];
      list = list.filter(y => y.month === currentMonthName);
    }

    // 3. Search Query Filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      list = list.filter(y => {
        const name = (y.name || '').toLowerCase();
        const contact = (y.contact || '').toLowerCase();
        const disp = (y.displayContact || '').toLowerCase();
        const dateStr = (y.formattedDate || '').toLowerCase();
        const monthStr = (y.month || '').toLowerCase();
        return (
          name.includes(q) ||
          contact.includes(q) ||
          disp.includes(q) ||
          dateStr.includes(q) ||
          monthStr.includes(q)
        );
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (state.sortOption === 'day-asc') {
        return a.day - b.day;
      } else if (state.sortOption === 'day-desc') {
        return b.day - a.day;
      } else if (state.sortOption === 'upcoming') {
        return getDaysUntilBirthday(a.monthNum, a.day) - getDaysUntilBirthday(b.monthNum, b.day);
      } else if (state.sortOption === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (state.sortOption === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });

    return list;
  }

  /**
   * Main View Switcher and Renderer
   */
  function renderMainContent() {
    const list = getFilteredAndSortedData();

    // Counts
    const displayedCountEl = document.getElementById('displayedCount');
    const totalCountEl = document.getElementById('totalAvailableCount');
    if (displayedCountEl) displayedCountEl.textContent = list.length;
    if (totalCountEl) totalCountEl.textContent = state.yuvaks.length;

    // View Containers
    const gridView = document.getElementById('cardsGridView');
    const tableView = document.getElementById('tableView');
    const calendarView = document.getElementById('calendarView');
    const emptyState = document.getElementById('emptyState');

    if (list.length === 0) {
      if (gridView) gridView.style.display = 'none';
      if (tableView) tableView.style.display = 'none';
      if (calendarView) calendarView.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (state.activeView === 'grid') {
      if (gridView) gridView.style.display = 'grid';
      if (tableView) tableView.style.display = 'none';
      if (calendarView) calendarView.style.display = 'none';
      renderCardsGrid(list);
    } else if (state.activeView === 'table') {
      if (gridView) gridView.style.display = 'none';
      if (tableView) tableView.style.display = 'block';
      if (calendarView) calendarView.style.display = 'none';
      renderTableView(list);
    } else if (state.activeView === 'calendar') {
      if (gridView) gridView.style.display = 'none';
      if (tableView) tableView.style.display = 'none';
      if (calendarView) calendarView.style.display = 'block';
      renderCalendarView(list);
    }
  }

  /**
   * Render Card Grid View (Upgraded Streamlit Cards)
   */
  function renderCardsGrid(list) {
    const container = document.getElementById('cardsGridView');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(yuvak => {
      const days = getDaysUntilBirthday(yuvak.monthNum, yuvak.day);
      const isToday = days === 0;
      const isTomorrow = days === 1;
      const turningAge = calculateTurningAge(yuvak.year, yuvak.monthNum, yuvak.day);
      const zodiac = getZodiac(yuvak.monthNum, yuvak.day);
      const initials = getInitials(yuvak.name);
      const waUrl = getWhatsAppLink(yuvak.name, yuvak.contact);

      let daysBadgeClass = 'days-pill';
      let daysBadgeText = `In ${days} days`;
      if (isToday) {
        daysBadgeClass += ' today';
        daysBadgeText = '🎂 Today!';
      } else if (isTomorrow) {
        daysBadgeClass += ' tomorrow';
        daysBadgeText = '🎈 Tomorrow!';
      } else if (days <= 7) {
        daysBadgeClass += ' upcoming';
      }

      const card = document.createElement('div');
      card.className = `yuvak-card ${isToday ? 'is-today' : ''}`;
      card.innerHTML = `
        <div class="card-top">
          <div class="user-avatar" title="${escapeHtml(yuvak.name)}">${initials}</div>
          <div class="user-info">
            <h3 class="user-name">${escapeHtml(yuvak.name)}</h3>
            <span class="${daysBadgeClass}">${daysBadgeText}</span>
          </div>
        </div>

        <div class="card-details">
          <div class="detail-row">
            <span class="detail-label"><span>📅</span> Birthdate</span>
            <span class="detail-value">${yuvak.formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><span>⭐</span> Sign / Age</span>
            <span class="detail-value" style="font-size:0.8rem;">
              ${zodiac} ${turningAge ? `• ${turningAge} yrs` : ''}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><span>📞</span> Contact</span>
            <span class="detail-value contact-value">
              <span>${yuvak.displayContact || yuvak.contact}</span>
              <button class="copy-contact-btn" data-copy="${yuvak.contact}" title="Copy phone number">📋</button>
            </span>
          </div>
        </div>

        <!-- Action Buttons (Streamlit upgrade) -->
        <div class="card-actions">
          <a href="tel:${yuvak.contact}" class="card-action-btn btn-call" title="Call ${escapeHtml(yuvak.name)}">
            📞 Call
          </a>
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-wa" title="Wish on WhatsApp">
            💬 WhatsApp
          </a>
        </div>

        <div class="card-footer-extra">
          <button class="card-extra-btn" data-wish-modal="${yuvak.id}" title="Compose Custom Wish">
            ✨ Custom Wish
          </button>
          <div style="display:flex; gap:6px;">
            <button class="card-extra-btn" data-edit-yuvak="${yuvak.id}" title="Edit Member">✏️ Edit</button>
            <button class="card-extra-btn" data-delete-yuvak="${yuvak.id}" title="Delete Member" style="color:var(--danger-color);">🗑️</button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Attach listeners for copy and modals
    attachCardListeners(container);
  }

  /**
   * Render Table View (Streamlit "View All Records" Expanded)
   */
  function renderTableView(list) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach((yuvak, index) => {
      const days = getDaysUntilBirthday(yuvak.monthNum, yuvak.day);
      const isToday = days === 0;
      const isTomorrow = days === 1;
      const initials = getInitials(yuvak.name);
      const waUrl = getWhatsAppLink(yuvak.name, yuvak.contact);

      let daysBadge = `<span class="days-pill ${isToday ? 'today' : (isTomorrow ? 'tomorrow' : (days <= 7 ? 'upcoming' : ''))}">
        ${isToday ? '🎂 Today!' : (isTomorrow ? '🎈 Tomorrow!' : `In ${days} days`)}
      </span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--text-muted); font-weight:600;">${index + 1}</td>
        <td>
          <div class="table-user-cell">
            <div class="table-avatar">${initials}</div>
            <div>
              <div style="font-weight:700;">${escapeHtml(yuvak.name)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${getZodiac(yuvak.monthNum, yuvak.day)}</div>
            </div>
          </div>
        </td>
        <td><strong>📅 ${yuvak.formattedDate}</strong> ${yuvak.year ? `<span style="font-size:0.8rem; color:var(--text-muted);">(${yuvak.year})</span>` : ''}</td>
        <td>${daysBadge}</td>
        <td>
          <span style="font-family:monospace; font-weight:600;">${yuvak.displayContact || yuvak.contact}</span>
        </td>
        <td>
          <div class="table-actions">
            <a href="tel:${yuvak.contact}" class="mini-action-btn call" title="Call">📞</a>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="mini-action-btn wa" title="WhatsApp">💬</a>
            <button class="mini-action-btn" data-wish-modal="${yuvak.id}" style="background:var(--accent-primary);" title="Custom Wish">✨</button>
            <button class="mini-action-btn" data-edit-yuvak="${yuvak.id}" style="background:var(--bg-glass); border:1px solid var(--border-subtle); color:var(--text-secondary) !important;" title="Edit">✏️</button>
            <button class="mini-action-btn" data-delete-yuvak="${yuvak.id}" style="background:rgba(239, 68, 68, 0.15); color:var(--danger-color) !important;" title="Delete">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    attachCardListeners(tbody);
  }

  /**
   * Render Monthly Calendar View
   */
  function renderCalendarView(list) {
    const grid = document.getElementById('calendarGrid');
    const titleEl = document.getElementById('calMonthTitle');
    if (!grid || !titleEl) return;

    grid.innerHTML = '';

    // Determine calendar month
    let targetMonthIdx;
    if (state.selectedMonth !== 'All') {
      targetMonthIdx = MONTH_NAMES.indexOf(state.selectedMonth);
    } else {
      targetMonthIdx = getCurrentDate().getMonth();
    }

    const targetYear = getCurrentDate().getFullYear();
    titleEl.textContent = `${MONTH_NAMES[targetMonthIdx]} ${targetYear}`;

    // Weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(d => {
      const header = document.createElement('div');
      header.className = 'cal-weekday';
      header.textContent = d;
      grid.appendChild(header);
    });

    // Days in month
    const firstDayIndex = new Date(targetYear, targetMonthIdx, 1).getDay();
    const daysInMonth = new Date(targetYear, targetMonthIdx + 1, 0).getDate();

    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell is-empty';
      grid.appendChild(empty);
    }

    const todayDate = getCurrentDate();
    const isCurrentCalendarMonth = (todayDate.getMonth() === targetMonthIdx);

    // Days cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';

      const isTodayCell = isCurrentCalendarMonth && (todayDate.getDate() === day);
      if (isTodayCell) cell.classList.add('is-today-cell');

      const birthdaysOnDay = state.yuvaks.filter(y => y.monthNum === targetMonthIdx + 1 && y.day === day);
      if (birthdaysOnDay.length > 0) cell.classList.add('has-birthday');

      let eventsHtml = '';
      birthdaysOnDay.forEach(y => {
        eventsHtml += `
          <div class="cal-event-pill" data-wish-modal="${y.id}" title="Wish ${escapeHtml(y.name)}">
            🎂 ${escapeHtml(y.name.split(' ')[0])}
          </div>
        `;
      });

      cell.innerHTML = `
        <div class="cal-day-num" ${isTodayCell ? 'style="color:var(--gold-color);"' : ''}>
          ${day} ${isTodayCell ? '• Today' : ''}
        </div>
        <div class="cal-day-events">${eventsHtml}</div>
      `;

      grid.appendChild(cell);
    }

    attachCardListeners(grid);
  }

  function attachCardListeners(parent) {
    // Copy contact button
    parent.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const text = btn.getAttribute('data-copy');
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            showToast(`📋 Copied ${text} to clipboard!`, 'success');
          }).catch(() => {
            showToast(`Mobile: ${text}`, 'info');
          });
        }
      });
    });

    // Custom wish modal trigger
    parent.querySelectorAll('[data-wish-modal]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const id = Number(btn.getAttribute('data-wish-modal'));
        const found = state.yuvaks.find(y => y.id === id);
        if (found) {
          openWishModal(found);
        }
      });
    });

    // Edit yuvak trigger
    parent.querySelectorAll('[data-edit-yuvak]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const id = Number(btn.getAttribute('data-edit-yuvak'));
        const found = state.yuvaks.find(y => y.id === id);
        if (found) {
          openEditModal(found);
        }
      });
    });

    // Delete yuvak trigger
    parent.querySelectorAll('[data-delete-yuvak]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const id = Number(btn.getAttribute('data-delete-yuvak'));
        const found = state.yuvaks.find(y => y.id === id);
        if (found && confirm(`Are you sure you want to remove ${found.name} from the birthday list?`)) {
          state.yuvaks = state.yuvaks.filter(y => y.id !== id);
          saveData();
          refreshUI();
          showToast(`🗑️ Removed ${found.name}`, 'info');
        }
      });
    });
  }

  // ==========================================================================
  // 7. WhatsApp Wish Templates & Modal
  // ==========================================================================

  function getWhatsAppLink(name, contact, customMsg) {
    const rawContact = (contact || '').replace(/\D/g, '');
    const cleanNumber = rawContact.length === 10 ? '91' + rawContact : rawContact;
    const msg = customMsg || `Happy Birthday ${name} 🎉🎂`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  }

  function getWishTemplate(type, name) {
    const cleanName = name || 'Yuvak';
    switch (type) {
      case 'baps':
        return `Jay Swaminarayan ${cleanName}! 🌸🙏\n\nજન્મદિવસની ખૂબ ખૂબ હાર્દિક શુભકામનાઓ! 🎂🎉\nભગવાન સ્વામિનારાયણ અને પરમ પૂજ્ય મહંત સ્વામી મહારાજના દિવ્ય આશીર્વાદ સદાય આપના પર રહે, આપને ઉત્તમ સ્વાસ્થ્ય, સુખ અને સત્સંગની વૃદ્ધિ અર્પે એવી અંતઃકરણપૂર્વક પ્રાર્થના! ✨💐`;
      case 'gujarati':
        return `જય સ્વામિનારાયણ ${cleanName}! 🎉🎂\n\nજન્મદિવસની હાર્દિક શુભકામનાઓ! આપનું આવનારું વર્ષ સુખ, શાંતિ, સ્વાસ્થ્ય અને સમૃદ્ધિથી ભરપૂર રહે એવી પ્રભુ ચરણોમાં પ્રાર્થના. 🙏💐`;
      case 'english':
        return `Happy Birthday ${cleanName}! 🎉🎂✨\n\nWishing you a joyful day and a fantastic year ahead filled with happiness, great health, and continued success! Enjoy your special day! 🥳🎈`;
      case 'short':
        return `Happy Birthday ${cleanName}! 🎉🎂 Have a wonderful and blessed day ahead! 🥳`;
      default:
        return `Happy Birthday ${cleanName} 🎉🎂`;
    }
  }

  function openWishModal(yuvak) {
    state.activeRecipient = yuvak;
    const overlay = document.getElementById('wishModalOverlay');
    const nameEl = document.getElementById('wishRecipientName');
    const contactEl = document.getElementById('wishRecipientContact');
    const textarea = document.getElementById('customWishText');
    const sendBtn = document.getElementById('sendWaDirectBtn');

    if (!overlay || !nameEl || !textarea) return;

    nameEl.textContent = yuvak.name;
    contactEl.textContent = yuvak.displayContact || yuvak.contact;

    // Default template: BAPS Blessing
    const initialText = getWishTemplate('baps', yuvak.name);
    textarea.value = initialText;

    // Reset preset buttons active state
    document.querySelectorAll('#wishPresets .wish-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === 'baps');
    });

    const updateLink = () => {
      sendBtn.href = getWhatsAppLink(yuvak.name, yuvak.contact, textarea.value);
    };
    updateLink();
    textarea.oninput = updateLink;

    overlay.classList.add('active');
  }

  // ==========================================================================
  // 8. Add & Edit Yuvak Modal Handlers
  // ==========================================================================

  function openAddModal() {
    const overlay = document.getElementById('yuvakFormModalOverlay');
    const title = document.getElementById('formModalTitle');
    const idInput = document.getElementById('editYuvakId');
    const nameInput = document.getElementById('formName');
    const dateInput = document.getElementById('formBirthdate');
    const contactInput = document.getElementById('formContact');

    title.innerHTML = '<span>➕</span> Add New Yuvak';
    idInput.value = '';
    nameInput.value = '';
    dateInput.value = '';
    contactInput.value = '';

    overlay.classList.add('active');
  }

  function openEditModal(yuvak) {
    const overlay = document.getElementById('yuvakFormModalOverlay');
    const title = document.getElementById('formModalTitle');
    const idInput = document.getElementById('editYuvakId');
    const nameInput = document.getElementById('formName');
    const dateInput = document.getElementById('formBirthdate');
    const contactInput = document.getElementById('formContact');

    title.innerHTML = '<span>✏️</span> Edit Member Details';
    idInput.value = yuvak.id;
    nameInput.value = yuvak.name;
    dateInput.value = yuvak.birthdate || '';
    contactInput.value = yuvak.contact || '';

    overlay.classList.add('active');
  }

  function handleYuvakFormSubmit(e) {
    e.preventDefault();
    const idVal = document.getElementById('editYuvakId').value;
    const name = document.getElementById('formName').value.trim();
    const dateStr = document.getElementById('formBirthdate').value;
    const rawContact = document.getElementById('formContact').value.trim();

    if (!name || !dateStr || !rawContact) {
      showToast('⚠️ Please fill out all required fields.', 'warning');
      return;
    }

    const bdate = new Date(dateStr);
    if (isNaN(bdate.getTime())) {
      showToast('⚠️ Invalid birthdate selected.', 'warning');
      return;
    }

    const { wa, display } = formatContact(rawContact);
    const day = bdate.getDate();
    const monthNum = bdate.getMonth() + 1;
    const month = MONTH_NAMES[bdate.getMonth()];
    const year = bdate.getFullYear();
    const formattedDate = `${day} ${month}`;

    if (idVal) {
      // Edit existing
      const index = state.yuvaks.findIndex(y => y.id === Number(idVal));
      if (index !== -1) {
        state.yuvaks[index] = {
          ...state.yuvaks[index],
          name,
          contact: wa,
          displayContact: display,
          birthdate: dateStr,
          day,
          month,
          monthNum,
          year,
          formattedDate
        };
        showToast(`✅ Updated ${name} successfully!`, 'success');
      }
    } else {
      // Create new
      const newId = state.yuvaks.length > 0 ? Math.max(...state.yuvaks.map(y => y.id || 0)) + 1 : 1;
      const newRecord = {
        id: newId,
        name,
        contact: wa,
        displayContact: display,
        birthdate: dateStr,
        day,
        month,
        monthNum,
        year,
        formattedDate
      };
      state.yuvaks.push(newRecord);
      showToast(`🎉 Added ${name} to birthday list!`, 'success');
    }

    saveData();
    closeAllModals();
    refreshUI();
  }

  // ==========================================================================
  // 9. Excel Import / Export (SheetJS)
  // ==========================================================================

  function handleExcelFile(file) {
    if (!file || typeof XLSX === 'undefined') {
      showToast('⚠️ SheetJS library is not available or file is invalid.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!Array.isArray(rawJson) || rawJson.length === 0) {
          showToast('⚠️ The Excel file is empty.', 'warning');
          return;
        }

        const baseDate = new Date(1899, 11, 30);
        const parsed = [];

        rawJson.forEach((row, idx) => {
          // Normalize column names
          let name = '';
          let rawContact = '';
          let rawDate = '';

          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey.includes('name')) name = String(row[key]).trim();
            if (cleanKey.includes('contact') || cleanKey.includes('mobile') || cleanKey.includes('phone')) rawContact = String(row[key]).trim();
            if (cleanKey.includes('birth') || cleanKey.includes('date') || cleanKey.includes('dob')) rawDate = String(row[key]).trim();
          }

          if (!name || !rawDate) return;

          let bdate = null;
          // Excel serial number test
          if (!isNaN(rawDate) && Number(rawDate) > 1000) {
            bdate = new Date(baseDate.getTime() + Number(rawDate) * 86400000);
          } else {
            const parsedD = new Date(rawDate);
            if (!isNaN(parsedD.getTime())) bdate = parsedD;
          }

          if (bdate) {
            const day = bdate.getDate();
            const monthNum = bdate.getMonth() + 1;
            const month = MONTH_NAMES[bdate.getMonth()];
            const year = bdate.getFullYear();
            const { wa, display } = formatContact(rawContact);

            parsed.push({
              id: idx + 1,
              name,
              contact: wa,
              displayContact: display,
              birthdate: `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              day,
              month,
              monthNum,
              year,
              formattedDate: `${day} ${month}`
            });
          }
        });

        if (parsed.length === 0) {
          showToast('⚠️ Could not find valid dates and names in the Excel file.', 'warning');
          return;
        }

        state.pendingImportData = parsed;
        const previewBox = document.getElementById('importPreview');
        const summaryText = document.getElementById('importSummaryText');
        const confirmBtn = document.getElementById('confirmImportBtn');

        if (previewBox && summaryText && confirmBtn) {
          previewBox.style.display = 'block';
          summaryText.innerHTML = `Found <strong>${parsed.length}</strong> valid members. First member: <em>${escapeHtml(parsed[0].name)}</em> (${parsed[0].formattedDate}).`;
          confirmBtn.disabled = false;
        }
      } catch (err) {
        console.error('Error parsing excel:', err);
        showToast('⚠️ Failed to parse Excel file. Check format.', 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function confirmImport() {
    if (!state.pendingImportData || state.pendingImportData.length === 0) return;
    state.yuvaks = state.pendingImportData;
    saveData();
    closeAllModals();
    refreshUI();
    showToast(`✅ Successfully imported ${state.yuvaks.length} members!`, 'success');
    launchConfetti();
  }

  function exportToExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('⚠️ Export library not available.', 'warning');
      return;
    }

    const exportRows = state.yuvaks.map((y, idx) => ({
      "Sr No": idx + 1,
      "Yuvak Name": y.name,
      "Birthdate": y.formattedDate,
      "Full Date": y.birthdate,
      "Contact No": y.contact,
      "Month": y.month,
      "Day": y.day
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Birthdays");
    XLSX.writeFile(workbook, "Gorwa_Yuvak_Birthdays.xlsx");
    showToast('📥 Downloaded Gorwa_Yuvak_Birthdays.xlsx', 'success');
  }

  // ==========================================================================
  // 10. Theme Toggle
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // ==========================================================================
  // 11. Modal Utilities
  // ==========================================================================

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  function initModals() {
    // Close on backdrop or close button click
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
        else closeAllModals();
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) {
          closeAllModals();
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });

    // Preset buttons in Wish Modal
    document.querySelectorAll('#wishPresets .wish-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#wishPresets .wish-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presetKey = btn.getAttribute('data-preset');
        const recipientName = state.activeRecipient ? state.activeRecipient.name : 'Yuvak';
        const textarea = document.getElementById('customWishText');
        const sendBtn = document.getElementById('sendWaDirectBtn');

        if (textarea) {
          textarea.value = getWishTemplate(presetKey, recipientName);
          if (sendBtn && state.activeRecipient) {
            sendBtn.href = getWhatsAppLink(state.activeRecipient.name, state.activeRecipient.contact, textarea.value);
          }
        }
      });
    });

    // Copy wish button
    const copyWishBtn = document.getElementById('copyWishBtn');
    if (copyWishBtn) {
      copyWishBtn.addEventListener('click', () => {
        const textarea = document.getElementById('customWishText');
        if (textarea && textarea.value) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            showToast('📋 Birthday wish copied to clipboard!', 'success');
          });
        }
      });
    }

    // Yuvak Form Submit
    const form = document.getElementById('yuvakForm');
    if (form) form.addEventListener('submit', handleYuvakFormSubmit);

    // Import Modal triggers
    const importBtn = document.getElementById('importModalBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const overlay = document.getElementById('importModalOverlay');
        const preview = document.getElementById('importPreview');
        const confirmBtn = document.getElementById('confirmImportBtn');
        if (preview) preview.style.display = 'none';
        if (confirmBtn) confirmBtn.disabled = true;
        state.pendingImportData = null;
        if (overlay) overlay.classList.add('active');
      });
    }

    // Confirm Import
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    if (confirmImportBtn) confirmImportBtn.addEventListener('click', confirmImport);

    // File Dropzone handlers
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('excelFileInput');
    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          handleExcelFile(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) {
          handleExcelFile(e.target.files[0]);
        }
      });
    }
  }

  // ==========================================================================
  // 12. Event Listeners & Controls Binding
  // ==========================================================================

  function updateFilterButtonsUI() {
    const filterTypeSelect = document.getElementById('filterTypeSelect');
    if (filterTypeSelect) {
      filterTypeSelect.value = state.activeFilter;
    }
  }

  function bindControls() {
    // Add Yuvak Button
    const addBtn = document.getElementById('addYuvakBtn');
    if (addBtn) addBtn.addEventListener('click', openAddModal);

    // Export Button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);

    // Reset Data Button
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetToDefault);

    // Confetti Hero Button
    const confettiBtn = document.getElementById('confettiBtn');
    if (confettiBtn) {
      confettiBtn.addEventListener('click', () => {
        launchConfetti();
        showToast('🎉 Wishing joyous celebrations to our Gorwa Yuvaks!', 'info');
      });
    }

    // Month Dropdown Listener
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
      monthSelect.addEventListener('change', e => {
        state.selectedMonth = e.target.value;
        refreshUI();
      });
    }

    // Filter Type Dropdown Listener
    const filterTypeSelect = document.getElementById('filterTypeSelect');
    if (filterTypeSelect) {
      filterTypeSelect.addEventListener('change', e => {
        state.activeFilter = e.target.value;
        refreshUI();
      });
    }

    // Search Input
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        if (searchClear) {
          searchClear.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderMainContent();
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        searchClear.style.display = 'none';
        renderMainContent();
        searchInput.focus();
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        state.sortOption = e.target.value;
        renderMainContent();
      });
    }

    // View Mode Switcher
    document.querySelectorAll('.view-toggle-group .view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-toggle-group .view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeView = btn.getAttribute('data-view');
        renderMainContent();
      });
    });

    // Reset Filter Button in Empty State
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        state.selectedMonth = 'All';
        state.activeFilter = 'all';
        state.searchQuery = '';
        if (monthSelect) monthSelect.value = 'All';
        if (filterTypeSelect) filterTypeSelect.value = 'all';
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.style.display = 'none';
        updateFilterButtonsUI();
        refreshUI();
      });
    }

    // Keyboard Shortcuts (Ctrl+K or / for search)
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== searchInput && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInput?.focus();
      }
    });
  }

  // ==========================================================================
  // 13. Helpers & Initialization
  // ==========================================================================

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function refreshUI() {
    renderMonthCarousel();
    renderSpotlightBanner();
    updateKPIStats();
    renderMainContent();
  }

  function initApp() {
    loadInitialData();
    initTheme();
    initLiveClock();
    initModals();
    bindControls();
    refreshUI();

    // Auto trigger confetti if someone has birthday today!
    const hasTodayBirthday = state.yuvaks.some(y => getDaysUntilBirthday(y.monthNum, y.day) === 0);
    if (hasTodayBirthday) {
      setTimeout(launchConfetti, 800);
    }
  }

  // Boot on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
