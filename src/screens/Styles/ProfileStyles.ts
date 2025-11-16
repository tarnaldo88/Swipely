import { StyleSheet} from "react-native";

export const ProfileStyles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: "#230234",
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: "#230234",
    maxWidth: 600,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#eff7e9",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#08f88c",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6C757D",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "#6C757D",
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
    marginBottom: 2,
  },
  preferenceValue: {
    fontSize: 14,
    color: "#6C757D",
  },
  chevron: {
    fontSize: 20,
    color: "#6C757D",
  },
  categoryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 8,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  accountLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  logoutButton: {
    backgroundColor: "#DC3545",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: "#6C757D",
  },
});

export const AccountStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  scrollView: {
    flex: 1,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor:'#fff'
  },
  accountLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#eff7e9",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#eff7e9",
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
});

export const FaqStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    backgroundColor: "#b8fcccff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerActive: {
    backgroundColor: "#3bfa8aff",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    backgroundColor: "#3f3939ff",
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: "#fff6f6ff",
    lineHeight: 20,
  },
  sectionTitle: {
    display: "none", // optional, can be removed
  },
});


export const HelpSupportStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  scrollView: {
    flex: 1,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor:'#fff'
  },
  accountLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  chevron: {
    fontSize: 20,
    color: "#6C757D",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#eff7e9",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#eff7e9",
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
  activeAccountItem: {
    backgroundColor: "#E6D7F5",
  },

  activeAccountLabel: {
    color: "#47006e",
    fontWeight: "600",
  },

  activeChevron: {
    color: "#47006e",
  },
});