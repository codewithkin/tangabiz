// Tangabiz Native App Library Exports

// Storage
export {
  storage,
  secureStorage,
  cacheStorage,
  StorageUtils,
  SecureStorageUtils,
  CacheUtils,
  STORAGE_KEYS,
} from './storage';

// API
export {
  api,
  apiRequest,
  authApi,
  businessApi,
  productsApi,
  categoriesApi,
  customersApi,
  transactionsApi,
  reportsApi,
  uploadApi,
  type ApiResponse,
  type PaginatedResponse,
  type RequestOptions,
} from './api';

// Files
export {
  pickDocument,
  pickImage,
  takePhoto,
  uploadFile,
  downloadFile,
  FileUtils,
  formatFileSize,
  getFileExtension,
  isImage,
  generateUniqueFilename,
  type PickedFile,
  type PickedImage,
  type UploadProgress,
} from './files';

// Utils
export {
  // Haptics
  haptics,
  // Clipboard
  clipboard,
  // Toast
  showToast,
  toast,
  // Formatting
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatPhone,
  // Validation
  validate,
  // Strings
  truncate,
  capitalize,
  titleCase,
  slugify,
  getInitials,
  // Arrays
  groupBy,
  sortBy,
  unique,
  // Debounce/Throttle
  debounce,
  throttle,
  // ID Generation
  generateId,
  generateShortId,
  generateReference,
  // Colors
  colors,
  roleColors,
  statusColors,
  transactionTypeColors,
} from './utils';
