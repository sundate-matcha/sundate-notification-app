import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationData } from "../../services/notificationService";

export default function NotiScreen() {
  const navigation = useNavigation();
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // userId is now optional - can be null if user is not logged in
  const userId = null; // TODO: Get from authentication context
  
  const {
    notifications,
    loading,
    error,
    unreadCount,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    filterByType,
    currentFilter,
  } = useNotifications(userId);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleNotificationPress = async (notification: NotificationData) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // Navigate to notification detail or related screen
    // navigation.navigate('NotificationDetail', { notificationId: notification.id });
  };

  const handleMarkAllRead = () => {
    Alert.alert(
      "Đánh dấu tất cả đã đọc",
      "Bạn có chắc chắn muốn đánh dấu tất cả thông báo là đã đọc?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xác nhận", onPress: markAllAsRead },
      ]
    );
  };

  const handleArchiveNotification = (notificationId: string) => {
    Alert.alert(
      "Lưu trữ thông báo",
      "Bạn có chắc chắn muốn lưu trữ thông báo này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Lưu trữ", onPress: () => archiveNotification(notificationId) },
      ]
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      "Xóa thông báo",
      "Bạn có chắc chắn muốn xóa thông báo này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => deleteNotification(notificationId) },
      ]
    );
  };

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[
        styles.card,
        !item.isRead && styles.unreadCard,
        item.priority === 'urgent' && styles.urgentCard,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
          {item.title}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => markAsUnread(item.id)}
            style={styles.actionButton}
          >
            <Ionicons 
              name={item.isRead ? "mail-outline" : "mail"} 
              size={20} 
              color="#831B1B" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleArchiveNotification(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="archive-outline" size={20} color="#831B1B" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteNotification(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.message}>{item.body}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleString('vi-VN')}
      </Text>
      {item.priority === 'urgent' && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>Khẩn cấp</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#831B1B" />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubtext}>
        {currentFilter ? `Không có thông báo loại "${currentFilter}"` : "Bạn sẽ nhận được thông báo mới ở đây"}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={30} color="#831B1B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
        <Text style={styles.header}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={24} color="#831B1B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done-outline" size={24} color="#831B1B" />
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContentContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Có lỗi xảy ra</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshNotifications}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshNotifications}
              colors={["#831B1B"]}
              tintColor="#831B1B"
            />
          }
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc thông báo</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#831B1B" />
              </TouchableOpacity>
            </View>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, !currentFilter && styles.filterOptionActive]}
                onPress={() => {
                  filterByType(null);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, !currentFilter && styles.filterOptionTextActive]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, currentFilter === 'reservation_created' && styles.filterOptionActive]}
                onPress={() => {
                  filterByType('reservation_created');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, currentFilter === 'reservation_created' && styles.filterOptionTextActive]}>
                  Đặt bàn mới
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, currentFilter === 'reservation_confirmed' && styles.filterOptionActive]}
                onPress={() => {
                  filterByType('reservation_confirmed');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, currentFilter === 'reservation_confirmed' && styles.filterOptionTextActive]}>
                  Xác nhận đặt bàn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, currentFilter === 'reservation_cancelled' && styles.filterOptionActive]}
                onPress={() => {
                  filterByType('reservation_cancelled');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, currentFilter === 'reservation_cancelled' && styles.filterOptionTextActive]}>
                  Hủy đặt bàn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, currentFilter === 'system' && styles.filterOptionActive]}
                onPress={() => {
                  filterByType('system');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterOptionText, currentFilter === 'system' && styles.filterOptionTextActive]}>
                  Hệ thống
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: "#F2F2F2", padding: 16, flex: 1 },
  headerContainer: {
    backgroundColor: "#FFF8DE",
    height: 122,
    alignItems: "flex-end",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  backButton: {
    marginBottom: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#831B1B",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    marginBottom: 24,
  },
  headerActionButton: {
    marginLeft: 12,
    padding: 4,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#831B1B",
  },
  urgentCard: {
    borderColor: "#FF6B6B",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#831B1B",
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: "900",
  },
  cardActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  message: { 
    fontSize: 14, 
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  urgentBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  urgentText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  footerLoader: {
    padding: 16,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F2F2F2",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#831B1B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#831B1B",
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  filterOptionActive: {
    backgroundColor: "#831B1B",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#333",
  },
  filterOptionTextActive: {
    color: "white",
    fontWeight: "bold",
  },
});
