/**
 * SSE (Server-Sent Events) Notification Service
 *
 * 실시간 알림을 위한 SSE 연결을 관리합니다.
 *
 * ⚙️ 설정 방법:
 * 1. 백엔드에서 SSE 엔드포인트 구현 (/api/notifications/stream)
 * 2. 아래 SSE_ENABLED를 true로 변경
 * 3. 필요시 SSE_BASE_URL 수정
 *
 * 백엔드가 준비되지 않았다면 SSE_ENABLED = false로 유지하세요.
 * (기존 폴링 방식으로 동작합니다)
 */

import { ref, type Ref } from 'vue'

export interface Notification {
  id: number
  message: string
  targetUrl?: string
  read: boolean
  createdAt: string
}

export interface NotificationEvent {
  type: 'new' | 'read' | 'deleted' | 'count_update'
  notification?: Notification
  count?: number
}

// ========================================
// SSE 설정 (백엔드 준비 후 변경)
// ========================================
const SSE_ENABLED = false // 🔴 백엔드 SSE 엔드포인트 구현 후 true로 변경
const SSE_BASE_URL = 'http://localhost:8080' // apiClient와 동일한 baseURL 사용
const MAX_RECONNECT_ATTEMPTS = 5 // 최대 재연결 시도 횟수 (초과 시 중단)

class NotificationSSEService {
  private eventSource: EventSource | null = null
  private reconnectTimer: number | null = null
  private reconnectDelay = 3000 // 3초 후 재연결
  private maxReconnectDelay = 30000 // 최대 30초
  private currentDelay = this.reconnectDelay
  private isManualClose = false
  private reconnectAttempts = 0 // 재연결 시도 횟수

  // 콜백 함수들
  private onNotificationCallback: ((event: NotificationEvent) => void) | null = null
  private onErrorCallback: ((error: Event) => void) | null = null
  private onConnectedCallback: (() => void) | null = null

  /**
   * SSE 연결 시작
   * @param accessToken - 인증 토큰
   */
  connect(accessToken: string) {
    // SSE가 비활성화되어 있으면 연결하지 않음
    if (!SSE_ENABLED) {
      console.log('ℹ️ SSE is disabled. Enable it in notificationService.ts when backend is ready.')
      return
    }

    // 이미 연결되어 있으면 중복 연결 방지
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      console.log('⚠️ SSE already connected')
      return
    }

    // 재연결 시도 횟수 초과 시 중단
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`⚠️ SSE reconnection limit reached (${MAX_RECONNECT_ATTEMPTS} attempts). Stopping reconnection.`)
      return
    }

    this.isManualClose = false

    try {
      // SSE 엔드포인트 (백엔드의 SSE URL)
      const sseUrl = `${SSE_BASE_URL}/api/notifications/stream?token=${encodeURIComponent(accessToken)}`

      console.log(`🔌 Connecting to SSE (attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}):`, sseUrl)
      this.eventSource = new EventSource(sseUrl)
      this.reconnectAttempts++

      // 연결 성공
      this.eventSource.onopen = () => {
        console.log('✅ SSE connected successfully')
        this.currentDelay = this.reconnectDelay // 재연결 지연 시간 초기화
        this.reconnectAttempts = 0 // 재연결 카운터 리셋
        if (this.onConnectedCallback) {
          this.onConnectedCallback()
        }
      }

      // 메시지 수신 - 일반 메시지 (event 타입이 지정되지 않은 경우)
      this.eventSource.onmessage = (event) => {
        console.log('📨 SSE message received:', event.data)
        try {
          const data: NotificationEvent = JSON.parse(event.data)
          if (this.onNotificationCallback) {
            this.onNotificationCallback(data)
          }
        } catch (e) {
          console.error('❌ Failed to parse SSE message:', e)
        }
      }

      // 특정 이벤트 타입 리스너 추가
      // 새 알림
      this.eventSource.addEventListener('notification', (event: MessageEvent) => {
        console.log('🔔 New notification:', event.data)
        try {
          const data: NotificationEvent = JSON.parse(event.data)
          if (this.onNotificationCallback) {
            this.onNotificationCallback(data)
          }
        } catch (e) {
          console.error('❌ Failed to parse notification event:', e)
        }
      })

      // 미읽음 개수 업데이트
      this.eventSource.addEventListener('count_update', (event: MessageEvent) => {
        console.log('🔢 Count update:', event.data)
        try {
          const data: NotificationEvent = JSON.parse(event.data)
          if (this.onNotificationCallback) {
            this.onNotificationCallback(data)
          }
        } catch (e) {
          console.error('❌ Failed to parse count_update event:', e)
        }
      })

      // 에러 처리
      this.eventSource.onerror = (error) => {
        // 재연결 시도 횟수가 적을 때만 에러 로그 출력
        if (this.reconnectAttempts < 3) {
          console.warn('⚠️ SSE connection error')
        }

        if (this.eventSource?.readyState === EventSource.CLOSED) {
          if (this.reconnectAttempts < 3) {
            console.log('🔌 SSE connection closed')
          }
        }

        if (this.onErrorCallback) {
          this.onErrorCallback(error)
        }

        // 수동으로 닫은 경우가 아니면 재연결 시도 (횟수 제한 포함)
        if (!this.isManualClose && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect(accessToken)
        } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn(`⚠️ SSE reconnection stopped after ${MAX_RECONNECT_ATTEMPTS} failed attempts. Please check if backend SSE endpoint is running.`)
        }
      }
    } catch (e) {
      console.error('❌ Failed to create SSE connection:', e)
      if (!this.isManualClose) {
        this.scheduleReconnect(accessToken)
      }
    }
  }

  /**
   * 재연결 스케줄링 (지수 백오프)
   */
  private scheduleReconnect(accessToken: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    // 재연결 제한 체크
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return
    }

    // 처음 몇 번만 로그 출력
    if (this.reconnectAttempts < 3) {
      console.log(`⏳ Reconnecting in ${this.currentDelay}ms... (attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.connect(accessToken)
      // 재연결 지연 시간 증가 (최대 30초까지)
      this.currentDelay = Math.min(this.currentDelay * 1.5, this.maxReconnectDelay)
    }, this.currentDelay)
  }

  /**
   * SSE 연결 해제
   */
  disconnect() {
    this.isManualClose = true

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      console.log('🔌 Disconnecting SSE')
      this.eventSource.close()
      this.eventSource = null
    }

    // 상태 리셋
    this.currentDelay = this.reconnectDelay
    this.reconnectAttempts = 0
  }

  /**
   * 알림 이벤트 콜백 등록
   */
  onNotification(callback: (event: NotificationEvent) => void) {
    this.onNotificationCallback = callback
  }

  /**
   * 에러 콜백 등록
   */
  onError(callback: (error: Event) => void) {
    this.onErrorCallback = callback
  }

  /**
   * 연결 성공 콜백 등록
   */
  onConnected(callback: () => void) {
    this.onConnectedCallback = callback
  }

  /**
   * 현재 연결 상태 확인
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}

// 싱글톤 인스턴스
export const notificationSSE = new NotificationSSEService()

export default notificationSSE
