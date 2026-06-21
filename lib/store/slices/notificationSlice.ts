import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/lib/api/client";

interface NotificationState {
  unreadCount: {
    total: number;
    orders: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  unreadCount: {
    total: 0,
    orders: 0,
  },
  isLoading: false,
  error: null,
};

export const fetchAdminNotificationCount = createAsyncThunk(
  "notifications/fetchAdminCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/notifications/unread-count");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notification count"
      );
    }
  }
);

export const markAdminNotificationsAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (type: string | undefined, { dispatch, rejectWithValue }) => {
    try {
      await apiClient.post("/admin/notifications/mark-read", { type });
      dispatch(fetchAdminNotificationCount());
      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notifications as read"
      );
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    resetNotificationCount: (state) => {
      state.unreadCount = { total: 0, orders: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminNotificationCount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminNotificationCount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.unreadCount = action.payload;
        state.error = null;
      })
      .addCase(fetchAdminNotificationCount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetNotificationCount } = notificationSlice.actions;
export default notificationSlice.reducer;
