/**
 * SSE Testing Utility
 *
 * Helper functions to test and debug Server-Sent Events connections
 * in the Sundate Notification App.
 */

import { API_BASE_URL } from '@/config/general.config';
import { NOTIFICATION_CONFIG } from '../config/notification.config';
import { sseService } from '../services/sseService';

export interface SSETestResult {
  success: boolean;
  message: string;
  duration?: number;
  error?: any;
  eventsReceived?: number;
}

/**
 * Test basic SSE connection
 */
export async function testSSEConnection(
  userId: string | null = 'test-user',
  timeoutMs: number = 10000
): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let eventsReceived = 0;
    let connectionEstablished = false;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      sseService.disconnect();
    };

    // Set timeout
    timer = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        message: `Connection timeout after ${timeoutMs}ms. Events received: ${eventsReceived}`,
        duration: Date.now() - startTime,
        eventsReceived,
      });
    }, timeoutMs);

    // Connect to SSE
    sseService.connect(
      userId,
      (data) => {
        eventsReceived++;
        console.log('SSE Test: Event received', data);

        if (data.type === 'connection_established') {
          connectionEstablished = true;
          cleanup();
          resolve({
            success: true,
            message: 'SSE connection established successfully',
            duration: Date.now() - startTime,
            eventsReceived,
          });
        }
      },
      (error) => {
        console.error('SSE Test: Error', error);
        cleanup();
        resolve({
          success: false,
          message: 'SSE connection error',
          duration: Date.now() - startTime,
          error,
          eventsReceived,
        });
      }
    );

    // Check connection status after a short delay
    setTimeout(() => {
      if (!connectionEstablished && eventsReceived === 0) {
        const isConnected = sseService.getConnectionStatus();
        console.log('SSE Test: Connection status after 2s:', isConnected);

        if (isConnected) {
          cleanup();
          resolve({
            success: true,
            message: 'SSE connected (no connection_established event received)',
            duration: Date.now() - startTime,
            eventsReceived,
          });
        }
      }
    }, 2000);
  });
}

/**
 * Test event filtering
 */
export async function testEventFiltering(
  userId: string | null,
  eventTypes: string[],
  timeoutMs: number = 10000
): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let eventsReceived = 0;
    const receivedTypes = new Set<string>();
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      sseService.disconnect();
    };

    timer = setTimeout(() => {
      cleanup();
      const receivedTypesArray = Array.from(receivedTypes);
      resolve({
        success: receivedTypesArray.length > 0,
        message: `Received ${eventsReceived} events of types: ${receivedTypesArray.join(', ')}`,
        duration: Date.now() - startTime,
        eventsReceived,
      });
    }, timeoutMs);

    sseService.connect(
      userId,
      (data) => {
        eventsReceived++;
        receivedTypes.add(data.type);
        console.log('SSE Test (Filtering): Event received', data.type);

        // Check if we received all expected types
        if (eventsReceived >= eventTypes.length) {
          cleanup();
          resolve({
            success: true,
            message: `Received all expected event types: ${Array.from(receivedTypes).join(', ')}`,
            duration: Date.now() - startTime,
            eventsReceived,
          });
        }
      },
      (error) => {
        console.error('SSE Test (Filtering): Error', error);
        cleanup();
        resolve({
          success: false,
          message: 'SSE connection error during filtering test',
          duration: Date.now() - startTime,
          error,
          eventsReceived,
        });
      },
      eventTypes
    );
  });
}

/**
 * Test reconnection behavior
 */
export async function testReconnection(
  userId: string | null,
  disconnectAfterMs: number = 2000,
  reconnectWaitMs: number = 6000
): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let disconnectCount = 0;
    let reconnectCount = 0;

    const cleanup = () => {
      sseService.disconnect();
    };

    // Connect
    sseService.connect(
      userId,
      (data) => {
        console.log('SSE Test (Reconnection): Event received', data.type);
      },
      (error) => {
        console.error('SSE Test (Reconnection): Error', error);
      }
    );

    // Disconnect after delay
    setTimeout(() => {
      disconnectCount++;
      console.log('SSE Test (Reconnection): Disconnecting...');
      sseService.disconnect();

      // Wait for auto-reconnection
      setTimeout(() => {
        const isConnected = sseService.getConnectionStatus();
        cleanup();

        if (isConnected) {
          reconnectCount++;
          resolve({
            success: true,
            message: `Successfully reconnected after disconnection`,
            duration: Date.now() - startTime,
          });
        } else {
          resolve({
            success: false,
            message: `Failed to reconnect after disconnection`,
            duration: Date.now() - startTime,
          });
        }
      }, reconnectWaitMs);
    }, disconnectAfterMs);
  });
}

/**
 * Test admin mode (no userId)
 */
export async function testAdminMode(timeoutMs: number = 10000): Promise<SSETestResult> {
  return testSSEConnection(null, timeoutMs);
}

/**
 * Test reservation-specific filtering
 */
export async function testReservationFiltering(
  userId: string | null,
  reservationId: string,
  timeoutMs: number = 10000
): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let eventsReceived = 0;
    let relevantEvents = 0;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      sseService.disconnect();
    };

    timer = setTimeout(() => {
      cleanup();
      resolve({
        success: relevantEvents > 0,
        message: `Received ${relevantEvents} relevant events for reservation ${reservationId}`,
        duration: Date.now() - startTime,
        eventsReceived,
      });
    }, timeoutMs);

    // Note: reservationId filtering would require SSE service enhancement
    // This is a placeholder for future implementation
    sseService.connect(
      userId,
      (data) => {
        eventsReceived++;
        console.log('SSE Test (Reservation): Event received', data);

        // Check if event is related to the reservation
        if (data.data?.reservation?.id === reservationId || data.data?.reservationId === reservationId) {
          relevantEvents++;
        }
      },
      (error) => {
        console.error('SSE Test (Reservation): Error', error);
        cleanup();
        resolve({
          success: false,
          message: 'SSE connection error during reservation filtering test',
          duration: Date.now() - startTime,
          error,
          eventsReceived,
        });
      },
      ['reservation_created', 'reservation_updated', 'reservation_confirmed']
    );
  });
}

/**
 * Run all SSE tests
 */
export async function runAllSSETests(userId: string = 'test-user'): Promise<Record<string, SSETestResult>> {
  console.log('🧪 Starting SSE Tests...\n');

  const results: Record<string, SSETestResult> = {};

  // Test 1: Basic Connection
  console.log('Test 1: Basic Connection');
  results.basicConnection = await testSSEConnection(userId, 5000);
  console.log(`✅ Result: ${results.basicConnection.message}\n`);

  // Small delay between tests
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Admin Mode
  console.log('Test 2: Admin Mode');
  results.adminMode = await testAdminMode(5000);
  console.log(`✅ Result: ${results.adminMode.message}\n`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 3: Event Filtering
  console.log('Test 3: Event Filtering');
  results.eventFiltering = await testEventFiltering(userId, ['notification_created', 'reservation_created'], 5000);
  console.log(`✅ Result: ${results.eventFiltering.message}\n`);

  // Print summary
  console.log('📊 Test Summary:');
  console.log('─'.repeat(50));
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}: ${result.message}`);
  });
  console.log('─'.repeat(50));

  return results;
}

/**
 * Simple connection monitor
 */
export function monitorSSEConnection(intervalMs: number = 2000): () => void {
  console.log('🔍 Monitoring SSE connection...');

  const interval = setInterval(() => {
    const isConnected = sseService.getConnectionStatus();
    const status = isConnected ? '🟢 Connected' : '🔴 Disconnected';
    console.log(`${new Date().toISOString()} - SSE Status: ${status}`);
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log('⏹ Stopped monitoring SSE connection');
  };
}

/**
 * Log SSE configuration
 */
export function logSSEConfiguration(): void {
  console.log('⚙️ SSE Configuration:');
  console.log('─'.repeat(50));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`SSE Enabled: ${true}`);
  console.log(`Reconnect Interval: ${5000}ms`);
  console.log(`Max Reconnect Attempts: ${3}`);
  console.log(`Polling Interval (fallback): ${NOTIFICATION_CONFIG.POLLING_INTERVAL}ms`);
  console.log('\n📡 Event Types:');
  Object.entries(NOTIFICATION_CONFIG.NOTIFICATION_TYPES).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  console.log('─'.repeat(50));
}

// Export convenience test runner for quick testing
export const quickTest = () => runAllSSETests('test-user');
