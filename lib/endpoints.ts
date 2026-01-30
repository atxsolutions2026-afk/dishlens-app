/**
 * Unified API endpoints export.
 * 
 * This file re-exports all API functions for backward compatibility.
 * New code should import directly from lib/api/public.ts or lib/api/admin.ts.
 * 
 * @deprecated Import directly from lib/api/public.ts or lib/api/admin.ts instead.
 */

// Public (customer) endpoints
export {
  publicMenu,
  createPublicOrder,
  getPublicOrder,
  getTableOrders,
  getCurrentWaiterCall,
  callWaiter,
  getTableService,
  rateMenuItem,
  orderLinesFromCart,
  type CreatePublicOrderPayload,
} from "./api/public";

// Admin/Staff endpoints
export {
  login,
  staffLogin,
  me,
  listRestaurants,
  staffListOrders,
  staffListTableOrders,
  staffClaimOrder,
  staffUpdateOrder,
  listOrders,
  updateOrderStatus,
  type ListOrdersOptions,
  adminMenu,
  createMenuCategory,
  updateMenuCategory,
  deactivateMenuCategory,
  createMenuItem,
  updateMenuItem,
  deactivateMenuItem,
  discontinueMenuItem,
  uploadMenuItemImage,
  uploadMenuItemVideo,
  uploadRestaurantLogo,
  uploadRestaurantHero,
  getQrToken,
  restaurantRatings,
  restaurantRatingsSummary,
} from "./api/admin";

// Kitchen endpoints
export {
  getKitchenOrders,
  markOrderReady,
} from "./api/kitchen";

// Waiter endpoints (additional)
export {
  getReadyOrders,
  markOrderServing,
  markOrderServed,
  createWaiterOrder,
  closeWaiterCall,
} from "./api/waiter";
