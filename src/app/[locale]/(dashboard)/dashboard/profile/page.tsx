"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "next-auth/react";
import { useUserData } from "@/hooks/useUserData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Mail, Calendar, CheckCircle, RefreshCw, Edit, Save, X, CreditCard, Activity, Shield } from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("sidebar");
  const pt = useTranslations("dashboard.profile");
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // 使用 useUserData hook 获取用户详情
  const { userDetail, loading, quota, quotaMonthlyUsed } = useUserData();

  const [editingUser, setEditingUser] = useState({
    name: userDetail?.name || user?.name || '',
    email: userDetail?.email || user?.email || ''
  });
  // console.log(userDetail);

  const handleRefundRequest = () => {
    setShowRefundModal(true);
  };

  const handleEditProfile = () => {
    setEditingUser({
      name: userDetail?.name || user?.name || '',
      email: userDetail?.email || user?.email || ''
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Success - close modal and reload user data
      setShowEditModal(false);
      window.location.reload(); // Simple refresh to update the user data
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmRefundRequest = () => {
    if (!user?.email) {
      alert('User email is required for refund request');
      return;
    }

    // 构建邮件内容
    const emailSubject = encodeURIComponent(`Refund Request - ${user.name || 'Unknown User'}`);

    const emailBody = encodeURIComponent(`Dear Support Team,

I would like to request a refund for my subscription.

User Information:
- Name: ${user.name || 'Not provided'}
- Email: ${user.email}
- User ID: ${user.id || 'Not provided'}
- Subscription Type: ${userDetail?.membershipLevel || 'Standard'}

Reason for refund request:
[Please describe your reason for requesting a refund here]

I understand that you will review my request and contact me within 24-48 hours.

Thank you for your assistance.

Best regards,
${user.name || user.email}
`);

    // 创建邮件链接
    const mailtoLink = `mailto:cfjwlchangji@gmail.com?subject=${emailSubject}&body=${emailBody}`;

    // 打开邮件客户端
    window.location.href = mailtoLink;
  };

  // Show loading while checking authentication or fetching data
  if (isLoading || loading) {
    return (
      <DashboardLayout
        pageTitle={t("profile")}
        hasActiveSubscription={false}
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-muted-foreground text-lg">{t("loading")}</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 如果用户没有订阅，显示提示信息
  if (!userDetail?.active) {
    return (
      <DashboardLayout
        pageTitle={t("profile")}
        hasActiveSubscription={false}
      >
        <div className="max-w-2xl mx-auto">
          <Card className="text-center p-8">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">{pt("title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{pt("noSubscription")}</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle={t("profile")}
      pageSubtitle={pt("subtitle")}
      hasActiveSubscription={userDetail?.active}
    >
      {user && (
        <div className="space-y-8">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={user.image || '/default_avatar.png'}
                    alt={userDetail.name || user.name || "Profile"}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                  <div className="absolute bottom-0 right-0 bg-green-500 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <CardTitle className="text-3xl font-bold text-white">
                    {userDetail.name || user.name || "User"}
                  </CardTitle>
                  <p className="text-blue-100 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userDetail.email || user.email}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="px-3 py-1 bg-green-500 text-white rounded-full font-medium">
                      {userDetail?.membershipLevel ? userDetail.membershipLevel.charAt(0).toUpperCase() + userDetail.membershipLevel.slice(1) : 'Standard'}
                    </div>
                    {userDetail?.active && (
                      <div className="px-3 py-1 bg-white/20 backdrop-blur text-white rounded-full font-medium flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Active
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quota !== undefined && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-4 mx-auto">
                    <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">${quota.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Monthly Quota</div>
                </CardContent>
              </Card>
            )}
            {quotaMonthlyUsed !== undefined && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 mb-4 mx-auto">
                    <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">${quotaMonthlyUsed.toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">Used This Month</div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 mb-4 mx-auto">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {quota && quotaMonthlyUsed !== undefined
                    ? `${((quotaMonthlyUsed / quota) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Usage Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 mb-4 mx-auto">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-foreground capitalize">
                  {userDetail?.membershipLevel || 'standard'}
                </div>
                <div className="text-sm text-muted-foreground">Plan</div>
              </CardContent>
            </Card>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <User className="w-5 h-5 text-primary" />
                    {pt("basicInformation")}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProfile}
                    className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {pt("edit")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">{pt("name")}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {userDetail.name || user.name || pt("notProvided")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">{pt("email")}</span>
                    <span className="text-sm font-semibold text-foreground break-all">
                      {userDetail.email || user.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">{pt("userId")}</span>
                    <span className="text-sm font-mono font-semibold text-foreground break-all" style={{ wordBreak: 'break-all' }}>
                      {userDetail?.userId || user?.id || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  {pt("accountDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{pt("subscriptionType")}</label>
                    <div className="px-4 py-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30">
                      <span className="text-primary font-semibold capitalize">
                        {userDetail?.membershipLevel || 'Standard'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{pt("subscriptionExpireDate")}</label>
                    <div className="px-4 py-3 bg-card rounded-lg border">
                      <span className="text-foreground font-medium">
                        {userDetail?.currentEndAt
                          ? new Date(userDetail.currentEndAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : userDetail?.active
                            ? 'Active (no expiry)'
                            : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{pt("memberSince")}</label>
                    <div className="px-4 py-3 bg-card rounded-lg border">
                      <span className="text-foreground font-medium">
                        {userDetail?.startDate
                          ? new Date(userDetail.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refund Button */}
                <div className="pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleRefundRequest}
                    className="w-full flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-200"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {pt("requestRefund")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowRefundModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <RefreshCw className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pt("requestRefund")}</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRefundModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  {pt("refundConfirm")}
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowRefundModal(false)}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {pt("cancel")}
                  </Button>
                  <Button
                    onClick={confirmRefundRequest}
                    className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {pt("openEmailClient")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Name
                </label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email
                </label>
                <Input
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}