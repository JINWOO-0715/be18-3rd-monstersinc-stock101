<template>
  <header :class="['site-header', { 'site-header--with-search': showHeaderSearch }]">
    <div class="header-left">
      <router-link to="/" class="brand">
        <span class="brand-mark" aria-hidden>●</span>
        <span class="brand-text">Stock 101</span>
      </router-link>
    </div>

    <div class="header-center">
      <div v-if="showHeaderSearch" class="search-wrap">
        <div class="search-container">
          <input type="text" class="main-search" placeholder="종목명 또는 종목 코드 검색 예) 삼성전자"
            v-model="query"
            @focus="showDropdown = true" @blur="handleBlur" @keyup.enter="onSearch" />
          <BaseButton class="search-btn" @click="onSearch">검색</BaseButton>
        </div>

        <div v-if="showDropdown && query.trim() && filteredStocks.length > 0" class="search-dropdown" ref="dropdownRef">
          <ul class="suggestion-list" ref="suggestionListRef">
            <li v-for="item in filteredStocks" :key="item.id" class="suggestion-item"
              @mousedown="selectSuggestion(item)">
              <div class="suggestion-info">
                <div class="suggestion-main">
                  <span class="suggestion-name">{{ item.name }}</span>
                  <span class="suggestion-market">{{ item.marketName }}</span>
                </div>
                <span class="suggestion-symbol">{{ item.symbol }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <nav class="header-right">
      <div class="nav-links">
        <router-link to="/" class="nav-link">홈</router-link>
      </div>

      <div class="nav-separator" aria-hidden>│</div>

      <div class="auth-area">
        <template v-if="auth.isLoggedIn">
          <!-- Notification icon (only when logged in) -->
          <div class="notification-wrapper" ref="notificationRef">
            <button class="notif-btn" @click="toggleNotif" aria-label="알림">
              <span class="notif-icon">🔔</span>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>

            <div v-if="showNotif" class="notif-dropdown">
              <div class="notif-header">
                <span>알림</span>
                <button v-if="unreadCount > 0" class="notif-read-all-btn" @click="markAllRead">모두 읽음</button>
              </div>
              <ul class="notif-list">
                <li v-for="n in recentNotifs" :key="n.id"
                    :class="['notif-item', n.isRead ? 'notif-item--read' : 'notif-item--unread']"
                    @click="openNotif(n)">
                  <span v-if="!n.isRead" class="notif-unread-dot"></span>
                  <div class="notif-content">
                    <div class="notif-message">{{ n.message }}</div>
                    <div class="notif-meta">{{ formatTime(n.receivedAt) }}</div>
                  </div>
                  <button class="notif-delete-btn" @click.stop="deleteNotif(n)" aria-label="삭제">&times;</button>
                </li>
                <li v-if="recentNotifs.length === 0" class="notif-empty">알림이 없습니다.</li>
              </ul>
            </div>
          </div>

          <router-link :to="{ path: `/profile/${auth.userInfo.userId || 'me'}` }" class="user-link">
            <img v-if="auth.userInfo.imageURL" :src="auth.userInfo.imageURL" class="avatar" />
            <span class="username">{{ auth.userInfo.userName ? `${auth.userInfo.userName}님` : '내 정보' }}</span>
          </router-link>
          <BaseButton class="btn-logout" variant="ghost" size="md" @click="handleLogout">로그아웃</BaseButton>
        </template>
        <template v-else>
          <BaseButton as="router-link" :to="{ path: '/auth/login' }" variant="ghost" size="md" class="login-text">로그인</BaseButton>
          <BaseButton as="router-link" :to="{ path: '/auth/register' }" variant="secondary" size="md" class="signup-pill">회원가입</BaseButton>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import BaseButton from '@/components/button/BaseButton.vue'
import { getAllStocks } from '@/api/stockSerivce'
import notificationSSE, {
  fetchNotifications as fetchNotificationsAPI,
  fetchUnreadCount as fetchUnreadCountAPI,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/api/notificationService'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()


// 검색 관련 상태 (main과 동일한 클래스/동작 재사용)
const query = ref('')
const showDropdown = ref(false)
const allStocks = ref([])
const dropdownRef = ref(null)
const suggestionListRef = ref(null)

const filteredStocks = computed(() => {
  const q = (query.value || '').trim().toLowerCase()
  if (!q) return []
  return allStocks.value.filter(stock => {
    const name = (stock.name || '').toLowerCase()
    const symbol = (stock.symbol || '').toLowerCase()
    return name.includes(q) || symbol.includes(q)
  }).slice(0, 10)
})

const handleBlur = () => {
  setTimeout(() => { showDropdown.value = false }, 200)
}

const selectSuggestion = (item) => {
  query.value = item.name
  showDropdown.value = false
  goStock(item.id)
}

const onSearch = async () => {
  if (!query.value.trim()) return
  try {
    if (filteredStocks.value.length > 0) {
      goStock(filteredStocks.value[0].id)
      showDropdown.value = false
    } else {
      // 검색 페이지로 이동(기존 헤더 동작 유지)
      router.push({ path: '/search', query: { q: query.value.trim() } })
    }
  } catch (e) {
    console.error('검색 중 오류', e)
  }
}

const goStock = (ticker) => router.push({ path: `/stock/${ticker}` })

const handleLogout = () => {
  auth.logout()
  router.push('/')
}

const goProfile = () => {
  const id = auth.userInfo?.userId || 'me'
  router.push({ path: `/profile/${id}` })
}

// 헤더 검색 노출 제어: 메인에서는 기본 숨김, 스크롤하면 노출
const showOnScroll = ref(false)
const isMainRoute = computed(() => route.name === 'main')
const showHeaderSearch = computed(() => !isMainRoute.value || showOnScroll.value)

const fetchStocks = async () => {
  try {
    allStocks.value = await getAllStocks()
  } catch (e) {
    console.error('전체 주식 데이터 로드 실패', e)
    allStocks.value = []
  }
}

const onScroll = () => { showOnScroll.value = window.scrollY > 120 }

// Notifications — backed by NotificationController API
const notifications = ref([])
const showNotif = ref(false)
const notificationRef = ref(null)
const unreadCount = ref(0)
const recentNotifs = computed(() => notifications.value.slice(0, 5))

const fetchNotifications = async () => {
  notifications.value = await fetchNotificationsAPI()
}

const fetchUnreadCount = async () => {
  unreadCount.value = await fetchUnreadCountAPI()
}

const toggleNotif = async () => {
  showNotif.value = !showNotif.value
  if (showNotif.value) await fetchNotifications()
}
const closeNotif = () => { showNotif.value = false }

const openNotif = async (n) => {
  if (!n.read) {
    const success = await markAsRead(n.id)
    if (success) {
      n.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }
  router.push(n.targetUrl || '/')
  closeNotif()
}

const markAllRead = async () => {
  const success = await markAllAsRead()
  if (success) {
    notifications.value.forEach(n => { n.read = true })
    unreadCount.value = 0
  }
}

const deleteNotif = async (n) => {
  const success = await deleteNotification(n.id)
  if (success) {
    notifications.value = notifications.value.filter(x => x.id !== n.id)
    if (!n.read) unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return date.toLocaleDateString('ko-KR')
}

const onDocClick = (e) => {
  if (!notificationRef.value) return
  const el = notificationRef.value
  if (el && !el.contains(e.target)) closeNotif()
}

// SSE 연결 및 이벤트 처리
const connectSSE = () => {
  if (!auth.isLoggedIn || !auth.userInfo.accessToken) {
    return
  }


  // SSE 이벤트 핸들러 등록
  notificationSSE.onNotification((event) => {

    switch (event.type) {
      case 'new':
        // 새 알림 수신
        if (event.notification) {
          notifications.value.unshift(event.notification)
          unreadCount.value += 1
        }
        break

      case 'count_update':
        // 미읽음 개수 업데이트
        if (typeof event.count === 'number') {
          unreadCount.value = event.count
        }
        break

      case 'read':
        // 알림 읽음 처리
        if (event.notification) {
          const notif = notifications.value.find(n => n.id === event.notification.id)
          if (notif) {
            notif.read = true
          }
        }
        break

      case 'deleted':
        // 알림 삭제
        if (event.notification) {
          notifications.value = notifications.value.filter(n => n.id !== event.notification.id)
        }
        break
    }
  })

  notificationSSE.onConnected(() => {
    // 연결 성공 시 초기 데이터 로드
    fetchUnreadCount()
    fetchNotifications()
  })

  notificationSSE.onError((error) => {
  })

  // SSE 연결 시작
  notificationSSE.connect(auth.userInfo.accessToken)
}

// SSE 연결 해제
const disconnectSSE = () => {
  notificationSSE.disconnect()
}

const loadNotifications = () => {
  if (auth.isLoggedIn) {
    fetchUnreadCount()
    fetchNotifications()
    connectSSE() // SSE 연결 추가
  }
}

watch(() => auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadNotifications()
  } else {
    notifications.value = []
    unreadCount.value = 0
    disconnectSSE() // 로그아웃 시 SSE 연결 해제
  }
})

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  fetchStocks()
  onScroll()
  document.addEventListener('click', onDocClick)
  loadNotifications()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDocClick)
  disconnectSSE() // 컴포넌트 언마운트 시 SSE 연결 해제
})
</script>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--brand-sub); /* Deep Navy */
  border-bottom: 1px solid rgba(255,255,255,0.04);
  position: sticky;
  top: 0;
  z-index: 50;
}

/* When header shows the search in smaller header layout, reduce vertical padding */
.site-header--with-search {
  padding: 8px 20px;
}

.site-header--with-search .search-container {
  padding: 6px; /* smaller inner padding to keep header compact */
  box-shadow: 0 6px 12px rgba(15,23,42,0.04);
}

.site-header--with-search .main-search {
  padding: 8px 12px;
}
.header-left .brand {
  display:flex; align-items:center; gap:10px; text-decoration:none;
}
.brand-mark{ color: var(--brand-main); font-size:16px; font-weight:900; display:inline-block; transform:translateY(-1px)}
.brand-text{ font-weight:900; font-size:20px; color:var(--brand-neutral); letter-spacing: -0.02em }
.header-center { flex: 1; display:flex; justify-content:center }
.search-form { display:flex; width: 60%; max-width:600px }
.search-form input { flex:1; padding:8px 12px; border:1px solid var(--brand-sub); border-radius:8px 0 0 8px }
.search-form button { padding:8px 14px; border:none; background:var(--brand-sub); color:var(--brand-neutral); border-radius:0 8px 8px 0 }
.header-right { display:flex; align-items:center; gap:8px }
.nav-links { display:flex; align-items:center; gap:6px }
.nav-separator { color: rgba(255,255,255,0.18); margin: 0 6px; font-weight:700 }
.nav-link { color:var(--brand-neutral); text-decoration:none; padding:6px 8px; margin:0 8px; position:relative; transition: color 160ms ease }
.nav-link:hover { color:var(--brand-main) }
.nav-link::after{ content:''; position:absolute; left:12%; right:12%; height:2px; bottom:-6px; background:transparent; transition: background-color .18s, transform .18s; transform:scaleX(0)}
.nav-link:hover::after{ background:var(--brand-main); transform:scaleX(1) }
.auth-area { display:flex; align-items:center; gap:8px }
.avatar { width:32px; height:32px; border-radius:50%; object-fit:cover }
.username { font-weight:600; color:var(--brand-neutral) }
.user-link { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--brand-neutral); padding:6px 8px; border-radius:8px }
.user-link:hover { color: var(--brand-main); background: rgba(255,255,255,0.03) }
.btn-link { background:transparent; border:none; color:var(--brand-neutral); cursor:pointer; border-radius:12px; padding:6px 10px }
.btn-primary { padding:6px 12px; background:var(--brand-sub); color:var(--brand-neutral); border-radius:12px; text-decoration:none }
.login-text { background: transparent; border: none; color:var(--brand-neutral); padding:6px 8px }
.signup-pill { border-radius: 999px; border: 1px solid var(--brand-main); color:var(--brand-main); background: transparent; padding:6px 12px }
.btn-logout { color: var(--brand-main) }

/* Notifications */
.notification-wrapper { position: relative; }
.notif-btn { background: transparent; border: none; color: var(--brand-neutral); cursor: pointer; padding: 6px; border-radius: 8px; position: relative }
.notif-btn:hover { background: rgba(255,255,255,0.03) }
.notif-icon { font-size: 18px }
.notif-badge { position: absolute; top: 2px; right: 0; min-width: 18px; height: 18px; padding: 0 5px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; line-height: 18px; text-align: center; border-radius: 999px; box-shadow: 0 0 0 2px var(--brand-sub) }
.notif-dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 320px; background: #ffffff; color: #0f172a; border-radius: 12px; box-shadow: 0 10px 30px rgba(2,6,23,0.12); border: 1px solid rgba(2,6,23,0.06); overflow: hidden; z-index: 200 }
.notif-header { padding: 12px 16px; font-weight: 800; border-bottom: 1px solid #eef2f6; display: flex; justify-content: space-between; align-items: center }
.notif-read-all-btn { background: none; border: none; color: var(--brand-main, #3b82f6); font-size: 13px; font-weight: 700; cursor: pointer; padding: 2px 6px; border-radius: 4px }
.notif-read-all-btn:hover { background: #f1f5f9 }
.notif-list { list-style:none; margin:0; padding: 8px; max-height: 360px; overflow-y: auto }
.notif-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; display:flex; align-items:center; gap:8px; transition: background 0.15s }
.notif-item:hover { background: #f1f5f9 }
.notif-item--unread { background: #eff6ff }
.notif-item--unread:hover { background: #dbeafe }
.notif-item--unread .notif-message { font-weight: 800; color: #0f172a }
.notif-item--read { opacity: 0.6 }
.notif-item--read:hover { opacity: 0.85 }
.notif-unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0 }
.notif-content { flex: 1; display: flex; flex-direction: column; gap: 4px }
.notif-message { font-weight: 500; color: #334155 }
.notif-meta { font-size: 12px; color: #94a3b8; font-weight: 600 }
.notif-delete-btn { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 2px 6px; border-radius: 4px; line-height: 1; flex-shrink: 0 }
.notif-delete-btn:hover { color: #ef4444; background: #fef2f2 }
.notif-empty { padding: 12px; color: #6b7280; text-align:center }

@media (max-width: 768px) {
  .search-form { width: 100% }
  .header-right .nav-link { display:none }
  .indices-card { padding: 8px 12px; gap:10px }
}

/* search styles copied from main.vue to keep header search identical */
.search-wrap {
  width: 100%;
  max-width: 460px; /* reduced size for header search */
  margin: 0 auto;
  position: relative;
  z-index: 100;
}

.search-container {
  display: flex;
  width: 100%;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: 12px;
  box-shadow: 0 10px 24px rgba(15,23,42,0.06);
  border: 1px solid var(--brand-sub); /* 검색창 테두리: Deep Navy */
  transition: box-shadow 160ms ease, transform 120ms ease;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  text-align: left;
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* thinner, less prominent scrollbar for suggestion lists */
.suggestion-list::-webkit-scrollbar { width: 8px; height: 8px }
.suggestion-list::-webkit-scrollbar-track { background: transparent }
.suggestion-list::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.08); border-radius: 999px; border: 2px solid transparent; background-clip: padding-box }
.suggestion-list { scrollbar-width: thin; scrollbar-color: rgba(15,23,42,0.08) transparent }

.suggestion-list { cursor: grab }
.suggestion-list:active { cursor: grabbing }

.suggestion-item {
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-item:last-child { border-bottom: none }
.suggestion-item:hover { background: #f9fafb }

.suggestion-info { display: flex; flex-direction: column; gap: 2px }
.suggestion-main { display: flex; align-items: center; gap: 8px }
.suggestion-market { font-size: 11px; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-weight: 700 }
.suggestion-name { font-size: 16px; font-weight: 600; color: var(--brand-sub) }
.suggestion-symbol { font-size: 13px; color: #6b7280 }

.main-search { flex: 1; border: none; padding: 14px 20px; font-size: 16px; outline: none; border-radius: calc(var(--card-radius) - 4px) }
.search-btn { background: var(--brand-sub); color: white; padding: 0 20px; border-radius: calc(var(--card-radius) - 4px); font-weight: 700 }
.search-btn:hover { filter: brightness(0.96) }

</style>


