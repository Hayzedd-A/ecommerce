import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isCartDrawerOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isAdminSidebarCollapsed: boolean;
  activeModal: string | null;
  modalData: unknown;
}

const initialState: UiState = {
  isCartDrawerOpen: false,
  isSearchOpen: false,
  isMobileMenuOpen: false,
  isAdminSidebarCollapsed: false,
  activeModal: null,
  modalData: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleCartDrawer(state) {
      state.isCartDrawerOpen = !state.isCartDrawerOpen;
    },
    setCartDrawer(state, action: PayloadAction<boolean>) {
      state.isCartDrawerOpen = action.payload;
    },

    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.isSearchOpen = action.payload;
    },

    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenu(state, action: PayloadAction<boolean>) {
      state.isMobileMenuOpen = action.payload;
    },

    toggleAdminSidebar(state) {
      state.isAdminSidebarCollapsed = !state.isAdminSidebarCollapsed;
    },

    openModal(state, action: PayloadAction<{ id: string; data?: unknown }>) {
      state.activeModal = action.payload.id;
      state.modalData = action.payload.data ?? null;
    },
    closeModal(state) {
      console.log("closing modal", state);
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

export const {
  toggleCartDrawer,
  setCartDrawer,
  toggleSearch,
  setSearchOpen,
  toggleMobileMenu,
  setMobileMenu,
  toggleAdminSidebar,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;
