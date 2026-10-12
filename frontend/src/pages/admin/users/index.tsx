import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getAdminStatsQueryFn,
  getAdminUsersQueryFn,
  approveUserMutationFn,
  rejectUserMutationFn,
  updateUserStatusMutationFn,
  updateUserRoleMutationFn,
  deleteUserMutationFn,
  impersonateUserMutationFn,
  AdminUserItem,
  UserRole,
  UserStatus,
} from "@/lib/api";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { formatTableDate } from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  MoreVertical,
  Trash2,
  Shield,
  UserCheck,
  Ban,
  ArrowUpRight,
  Landmark,
  Layers,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuthContext();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Modals state
  const [rejectModalUser, setRejectModalUser] = useState<AdminUserItem | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const [deleteModalUser, setDeleteModalUser] = useState<AdminUserItem | null>(
    null
  );

  const [roleModalUser, setRoleModalUser] = useState<AdminUserItem | null>(
    null
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");

  // Fetch Admin Stats
  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStatsQueryFn,
    staleTime: 1000 * 30,
  });

  // Fetch Users List
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["adminUsers", page, searchTerm, statusFilter, roleFilter],
    queryFn: () =>
      getAdminUsersQueryFn({
        page,
        limit: 20,
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
      }),
    staleTime: 1000 * 15,
  });

  const stats = statsData?.stats;
  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  // Pending users queue
  const pendingUsers = users.filter((u) => u.status === "PENDING_APPROVAL");

  // Mutations
  const approveMutation = useMutation({
    mutationFn: approveUserMutationFn,
    onSuccess: (_, userId) => {
      toast({
        title: "Account Approved",
        description: "The user has been activated and sent an approval email.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description:
          error?.response?.data?.message || "Could not approve account",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectUserMutationFn,
    onSuccess: () => {
      toast({
        title: "Account Rejected",
        description: "The registration was declined.",
      });
      setRejectModalUser(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description:
          error?.response?.data?.message || "Could not reject account",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateUserStatusMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Status Updated",
        description: data?.data?.message || "User status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description:
          error?.response?.data?.message || "Could not update status",
        variant: "destructive",
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: updateUserRoleMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Role Updated",
        description: data?.data?.message || "User role updated successfully",
      });
      setRoleModalUser(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Role Update Failed",
        description:
          error?.response?.data?.message || "Could not update user role",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserMutationFn,
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User and all financial records have been removed.",
      });
      setDeleteModalUser(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description:
          error?.response?.data?.message || "Could not delete user",
        variant: "destructive",
      });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: impersonateUserMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Impersonation Mode Activated",
        description: `Now viewing workspace as ${data?.data?.targetUser?.name || "user"}.`,
      });
      // Invalidate queries so target user's data loads cleanly
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      navigate("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Impersonation Failed",
        description:
          error?.response?.data?.message || "Could not start impersonation",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Super Admin Control Center
                <span className="text-xs bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Root Admin
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage all registered users, approve new access requests, and safely impersonate workspaces.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isUsersFetching}
            className="h-9 px-3 text-xs"
          >
            {isUsersFetching ? (
              <MacSpinner size="xs" className="mr-1.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isStatsLoading ? <MacSpinner size="xs" /> : stats?.totalUsers || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Total Registered
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 transition-all ${
            (stats?.pendingUsers || 0) > 0
              ? "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200"
              : "bg-card dark:border-slate-800"
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              (stats?.pendingUsers || 0) > 0
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight flex items-center gap-2">
              {isStatsLoading ? <MacSpinner size="xs" /> : stats?.pendingUsers || 0}
              {(stats?.pendingUsers || 0) > 0 && (
                <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Action Needed
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Pending Approvals
            </div>
          </div>
        </div>

        {/* Approved Active */}
        <div className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isStatsLoading ? <MacSpinner size="xs" /> : stats?.approvedUsers || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Active Accounts
            </div>
          </div>
        </div>

        {/* Suspended / Inactive */}
        <div className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isStatsLoading
                ? <MacSpinner size="xs" />
                : (stats?.suspendedUsers || 0) + (stats?.rejectedUsers || 0)}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Suspended / Declined
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Review Queue (if any pending) */}
      {(stats?.pendingUsers || 0) > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Registration Requests
              </h2>
              <span className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                {pendingUsers.length} waiting
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Review and approve to allow login access
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingUsers.map((pUser) => (
              <div
                key={pUser._id}
                className="p-4 rounded-xl bg-card border dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {pUser.name}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {pUser.email}
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full shrink-0">
                      Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Registered: {formatTableDate(pUser.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t dark:border-slate-800">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(pUser._id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
                  >
                    {approveMutation.isPending ? (
                      <MacSpinner size="xs" className="mr-1" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectModalUser(pUser);
                      setRejectionReason("");
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8 px-2.5"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Directory & Controls */}
      <div className="p-6 rounded-2xl bg-card border dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              User Accounts Directory
            </h2>
            <p className="text-xs text-muted-foreground">
              Search, filter, manage roles, and activate impersonation mode
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-9 bg-background"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
            >
              <SelectTrigger className="w-[130px] h-9 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(val) => setRoleFilter(val)}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs bg-background">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Banks</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {isUsersLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <MacSpinner size="md" className="mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Loading users directory...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrentAdmin =
                    item._id === currentAdmin?._id ||
                    item.email === currentAdmin?.email;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                            {item.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {item.name}
                              {isCurrentAdmin && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground truncate font-mono text-[11px]">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {item.role === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                            <Shield className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {item.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {item.status === "PENDING_APPROVAL" && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {item.status === "SUSPENDED" && (
                          <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                            <UserX className="w-3 h-3" />
                            Declined
                          </span>
                        )}
                      </td>

                      {/* Bank Accounts */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.accountCount || 0} accounts</span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatTableDate(item.createdAt)}
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  impersonateMutation.isPending &&
                                  impersonateMutation.variables === item._id
                                }
                                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs transition-all data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800 data-[state=open]:ring-2 data-[state=open]:ring-emerald-500/20"
                                title="User options"
                              >
                                {impersonateMutation.isPending &&
                                impersonateMutation.variables === item._id ? (
                                  <MacSpinner size="xs" />
                                ) : (
                                  <MoreHorizontal className="w-4 h-4" />
                                )}
                                <span className="sr-only">User Actions</span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-48 text-xs rounded-xl shadow-lg border border-border/80"
                            >
                              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5">
                                User Options
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              {/* Impersonate User */}
                              {!isCurrentAdmin && item.status === "APPROVED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    impersonateMutation.mutate(item._id)
                                  }
                                  className="text-amber-800 dark:text-amber-300 font-medium cursor-pointer focus:bg-amber-500/10"
                                >
                                  <LogIn className="w-3.5 h-3.5 mr-2 text-amber-600 dark:text-amber-400" />
                                  <span>Impersonate User</span>
                                </DropdownMenuItem>
                              )}

                              {/* Approve if Pending */}
                              {item.status === "PENDING_APPROVAL" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      approveMutation.mutate(item._id)
                                    }
                                    className="text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer focus:bg-emerald-500/10"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                    <span>Approve Account</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setRejectModalUser(item);
                                      setRejectionReason("");
                                    }}
                                    className="text-rose-700 dark:text-rose-400 cursor-pointer focus:bg-rose-500/10"
                                  >
                                    <UserX className="w-3.5 h-3.5 mr-2 text-rose-600" />
                                    <span>Decline Request</span>
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Suspend or Reactivate */}
                              {!isCurrentAdmin && item.status === "APPROVED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    statusMutation.mutate({
                                      id: item._id,
                                      status: "SUSPENDED",
                                    })
                                  }
                                  className="cursor-pointer text-amber-700 dark:text-amber-400 focus:bg-amber-500/10"
                                >
                                  <Ban className="w-3.5 h-3.5 mr-2 text-amber-600" />
                                  <span>Suspend Account</span>
                                </DropdownMenuItem>
                              )}

                              {!isCurrentAdmin && item.status === "SUSPENDED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    statusMutation.mutate({
                                      id: item._id,
                                      status: "APPROVED",
                                    })
                                  }
                                  className="cursor-pointer text-emerald-700 dark:text-emerald-400 focus:bg-emerald-500/10"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                  <span>Reactivate Account</span>
                                </DropdownMenuItem>
                              )}

                              {/* Change Role */}
                              {!isCurrentAdmin && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRoleModalUser(item);
                                    setSelectedRole(item.role);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Shield className="w-3.5 h-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                  <span>Change Role</span>
                                </DropdownMenuItem>
                              )}

                              {/* Self account notice */}
                              {isCurrentAdmin && (
                                <DropdownMenuItem
                                  disabled
                                  className="text-muted-foreground text-[11px]"
                                >
                                  Current Active Account
                                </DropdownMenuItem>
                              )}

                              {/* Delete Account */}
                              {!isCurrentAdmin && item.role !== "SUPER_ADMIN" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteModalUser(item)}
                                    className="cursor-pointer text-rose-600 dark:text-rose-400 font-medium focus:bg-rose-500/10 focus:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-600" />
                                    <span>Delete Account</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decline / Rejection Modal */}
      <Dialog
        open={!!rejectModalUser}
        onOpenChange={(open) => !open && setRejectModalUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Decline Registration Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Decline access for{" "}
              <strong>{rejectModalUser?.name}</strong> ({rejectModalUser?.email}). An email notification will be sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional Reason / Note:
            </label>
            <Input
              placeholder="e.g. Platform invite required or unauthorized domain"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalUser(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (rejectModalUser) {
                  rejectMutation.mutate({
                    id: rejectModalUser._id,
                    reason: rejectionReason,
                  });
                }
              }}
              disabled={rejectMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {rejectMutation.isPending ? (
                <MacSpinner size="xs" className="mr-1.5" />
              ) : null}
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog
        open={!!deleteModalUser}
        onOpenChange={(open) => !open && setDeleteModalUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete{" "}
              <strong>{deleteModalUser?.name}</strong> ({deleteModalUser?.email})?
              <br />
              <br />
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Warning:
              </span>{" "}
              All bank accounts, imported statements, transactions, and contacts associated with this user will be permanently destroyed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalUser(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (deleteModalUser) {
                  deleteMutation.mutate(deleteModalUser._id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending ? (
                <MacSpinner size="xs" className="mr-1.5" />
              ) : null}
              Yes, Delete User & Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog
        open={!!roleModalUser}
        onOpenChange={(open) => !open && setRoleModalUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Modify User Privilege Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Change permissions for{" "}
              <strong>{roleModalUser?.name}</strong> ({roleModalUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Role:
            </label>
            <Select
              value={selectedRole}
              onValueChange={(val: UserRole) => setSelectedRole(val)}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Standard User</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleModalUser(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (roleModalUser) {
                  roleMutation.mutate({
                    id: roleModalUser._id,
                    role: selectedRole,
                  });
                }
              }}
              disabled={roleMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {roleMutation.isPending ? (
                <MacSpinner size="xs" className="mr-1.5" />
              ) : null}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
