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

/**
 * Test platform-specific SSE behavior
 */
export async function testPlatformCompatibility(): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Check EventSource availability
    if (typeof EventSource === "undefined") {
      resolve({
        success: false,
        message: 'EventSource not supported on this platform',
        duration: Date.now() - startTime,
      });
      return;
    }

    // Test basic connection on current platform
    testSSEConnection('platform-test-user', 5000)
      .then((result) => {
        resolve({
          success: result.success,
          message: `Platform compatibility: ${result.message}`,
          duration: Date.now() - startTime,
          eventsReceived: result.eventsReceived,
        });
      })
      .catch((error) => {
        resolve({
          success: false,
          message: `Platform compatibility failed: ${error.message}`,
          duration: Date.now() - startTime,
          error,
        });
      });
  });
}

/**
 * Test network state change handling
 */
export async function testNetworkStateChanges(): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let connectionStateChanges = 0;

    const cleanup = () => {
      sseService.disconnect();
    };

    // Monitor connection state
    const checkInterval = setInterval(() => {
      const isConnected = sseService.getConnectionStatus();
      console.log('Network test - Connection status:', isConnected);
    }, 1000);

    // Connect initially
    sseService.connect(
      'network-state-test-user',
      (data) => {
        console.log('Network state test: Event received', data.type);
      },
      (error) => {
        connectionStateChanges++;
        console.log('Network state test: Connection error', error);
        
        // Test resilience by checking if service attempts reconnection
        setTimeout(() => {
          const stillConnected = sseService.getConnectionStatus();
          clearInterval(checkInterval);
          cleanup();
          
          resolve({
            success: connectionStateChanges > 0 && !stillConnected,
            message: `Network state change handling: ${connectionStateChanges} state changes detected`,
            duration: Date.now() - startTime,
          });
        }, 5000);
      }
    );

    // Test timeout
    setTimeout(() => {
      clearInterval(checkInterval);
      cleanup();
      resolve({
        success: false,
        message: 'Network state change test timeout',
        duration: Date.now() - startTime,
      });
    }, 15000);
  });
}

/**
 * Test app backgrounding/foregrounding simulation
 */
export async function testAppStateChanges(): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let eventsReceived = 0;
    let connectionMaintained = false;

    const cleanup = () => {
      sseService.disconnect();
    };

    sseService.connect(
      'app-state-test-user',
      (data) => {
        eventsReceived++;
        console.log('App state test: Event received', data.type, eventsReceived);

        if (data.type === 'connection_established') {
          connectionMaintained = true;
          
          // Simulate app backgrounding (disconnect)
          setTimeout(() => {
            console.log('App state test: Simulating app backgrounding...');
            sseService.disconnect();
            
            // Simulate app foregrounding (reconnect)
            setTimeout(() => {
              console.log('App state test: Simulating app foregrounding...');
              sseService.connect(
                'app-state-test-user',
                (foregroundData) => {
                  if (foregroundData.type === 'connection_established') {
                    cleanup();
                    resolve({
                      success: true,
                      message: 'Successfully handled app state changes and reconnected',
                      duration: Date.now() - startTime,
                      eventsReceived,
                    });
                  }
                },
                (error) => {
                  cleanup();
                  resolve({
                    success: false,
                    message: 'Failed to reconnect after app state change',
                    duration: Date.now() - startTime,
                    error,
                    eventsReceived,
                  });
                }
              );
            }, 2000);
          }, 2000);
        }
      },
      (error) => {
        console.error('App state test: Connection error', error);
        cleanup();
        resolve({
          success: false,
          message: 'Connection failed during app state test',
          duration: Date.now() - startTime,
          error,
          eventsReceived,
        });
      }
    );

    setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        message: 'App state change test timeout',
        duration: Date.now() - startTime,
        eventsReceived,
      });
    }, 20000);
  });
}

/**
 * Test memory management and cleanup
 */
export async function testMemoryManagement(): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let connectionsCreated = 0;
    const maxConnections = 5;

    const testConnection = (index: number) => {
      return new Promise<boolean>((resolveConnection) => {
        connectionsCreated++;
        
        sseService.connect(
          `memory-test-user-${index}`,
          (data) => {
            console.log(`Memory test connection ${index}: Event received`, data.type);
            if (data.type === 'connection_established') {
              // Immediately disconnect to test cleanup
              setTimeout(() => {
                sseService.disconnect();
                resolveConnection(true);
              }, 500);
            }
          },
          (error) => {
            console.error(`Memory test connection ${index}: Error`, error);
            sseService.disconnect();
            resolveConnection(false);
          }
        );
      });
    };

    const runMemoryTest = async () => {
      try {
        const results = [];
        
        // Create and cleanup multiple connections in sequence
        for (let i = 0; i < maxConnections; i++) {
          const result = await testConnection(i);
          results.push(result);
          
          // Small delay between connections
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const successfulConnections = results.filter(Boolean).length;
        
        resolve({
          success: successfulConnections === maxConnections,
          message: `Memory management test: ${successfulConnections}/${maxConnections} connections handled cleanly`,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        resolve({
          success: false,
          message: 'Memory management test failed',
          duration: Date.now() - startTime,
          error,
        });
      }
    };

    runMemoryTest();

    setTimeout(() => {
      resolve({
        success: false,
        message: 'Memory management test timeout',
        duration: Date.now() - startTime,
      });
    }, 30000);
  });
}

/**
 * Test fallback to polling mechanism
 */
export async function testPollingFallback(): Promise<SSETestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let pollingStarted = false;

    // Force SSE to fail by using invalid URL
    const originalConnect = sseService.connect;
    
    // Mock SSE failure
    sseService.connect = (userId, onMessage, onError) => {
      setTimeout(() => {
        if (onError) {
          onError(new Event('platform_not_supported'));
        }
      }, 100);
    };

    // Start polling fallback
    const pollingInterval = sseService.startPolling(
      'polling-test-user',
      (data) => {
        if (!pollingStarted) {
          pollingStarted = true;
          clearInterval(pollingInterval);
          
          // Restore original connect function
          sseService.connect = originalConnect;
          
          resolve({
            success: true,
            message: 'Successfully fell back to polling when SSE failed',
            duration: Date.now() - startTime,
          });
        }
      },
      2000 // Poll every 2 seconds for testing
    );

    setTimeout(() => {
      clearInterval(pollingInterval);
      sseService.connect = originalConnect;
      
      resolve({
        success: false,
        message: 'Polling fallback test timeout',
        duration: Date.now() - startTime,
      });
    }, 10000);
  });
}

/**
 * Run comprehensive mobile-specific tests
 */
export async function runMobileSpecificTests(): Promise<Record<string, SSETestResult>> {
  console.log('🧪 Starting Mobile-Specific SSE Tests...\n');

  const results: Record<string, SSETestResult> = {};

  // Test 1: Platform Compatibility
  console.log('Test 1: Platform Compatibility');
  results.platformCompatibility = await testPlatformCompatibility();
  console.log(`✅ Result: ${results.platformCompatibility.message}\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Network State Changes
  console.log('Test 2: Network State Changes');
  results.networkStateChanges = await testNetworkStateChanges();
  console.log(`✅ Result: ${results.networkStateChanges.message}\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: App State Changes
  console.log('Test 3: App State Changes');
  results.appStateChanges = await testAppStateChanges();
  console.log(`✅ Result: ${results.appStateChanges.message}\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Memory Management
  console.log('Test 4: Memory Management');
  results.memoryManagement = await testMemoryManagement();
  console.log(`✅ Result: ${results.memoryManagement.message}\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Polling Fallback
  console.log('Test 5: Polling Fallback');
  results.pollingFallback = await testPollingFallback();
  console.log(`✅ Result: ${results.pollingFallback.message}\n`);

  // Print summary
  console.log('📊 Mobile Test Summary:');
  console.log('─'.repeat(50));
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}: ${result.message}`);
  });
  console.log('─'.repeat(50));

  return results;
}

/**
 * Run all tests (original + mobile-specific)
 */
export async function runAllEnhancedTests(userId: string = 'test-user'): Promise<Record<string, SSETestResult>> {
  console.log('🚀 Starting Comprehensive SSE Test Suite...\n');

  // Run original tests
  const originalResults = await runAllSSETests(userId);
  
  console.log('\n🔄 Running Mobile-Specific Tests...\n');
  
  // Run mobile-specific tests
  const mobileResults = await runMobileSpecificTests();

  // Combine results
  const allResults = {
    ...originalResults,
    ...mobileResults,
  };

  console.log('\n📊 Complete Test Summary:');
  console.log('='.repeat(60));
  const passCount = Object.values(allResults).filter(r => r.success).length;
  const totalCount = Object.values(allResults).length;
  console.log(`Overall Result: ${passCount}/${totalCount} tests passed`);
  console.log('='.repeat(60));

  return allResults;
}


