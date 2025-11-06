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
import { User, Mail, Calendar, CheckCircle, RefreshCw, Edit, Save, X } from "lucide-react";

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
  const { userDetail, loading } = useUserData();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // 如果用户没有订阅，显示提示信息
  if (!userDetail?.active) {
    return (
      <DashboardLayout
        pageTitle={t("profile")}
        hasActiveSubscription={false}
        stripeCustomerId={userDetail?.stripeCustomerId}
      >
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">{pt("title")}</h2>
          <p className="text-gray-600">{pt("noSubscription")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle={t("profile")}
      pageSubtitle={pt("subtitle")}
      hasActiveSubscription={userDetail?.active}
      stripeCustomerId={userDetail?.stripeCustomerId}
    >
      {user && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={user.image || '/default_avatar.png'}
                    alt={userDetail.name || user.name || "Profile"}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {userDetail.name || user.name || "User"}
                  </CardTitle>
                  <p className="text-gray-600 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userDetail.email || user.email}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    {pt("basicInformation")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditProfile}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{pt("name")}</span>
                  <span className="text-sm text-gray-900">{userDetail.name || user.name || pt("notProvided")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{pt("email")}</span>
                  <span className="text-sm text-gray-900">{userDetail.email || user.email}</span>
                </div>
                {/* <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{pt("nickname")}</span>
                  <span className="text-sm text-gray-900">{user.nickname || pt("notProvided")}</span>
                </div> */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{pt("userId")}</span>
                  <span className="text-gray-900 font-mono text-xs break-all" style={{ wordBreak: 'break-all', maxWidth: '300px' }}>
                    {userDetail?.auth0UserId || user?.id || "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  {pt("accountDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{pt("subscriptionType")}</span>
                  <span className="text-sm text-blue-600 font-medium capitalize">
                    {userDetail?.membershipLevel || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{pt("subscriptionExpireDate")}</span>
                  <span className="text-sm text-gray-900">
                    {userDetail?.currentEndAt
                      ? new Date(userDetail.currentEndAt).toLocaleDateString()
                      : userDetail?.active
                        ? 'Active (no expiry)'
                        : 'N/A'
                    }
                  </span>
                </div>
                {userDetail?.requestLimit && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">{pt("requestLimit")}</span>
                    <span className="text-sm text-gray-900">
                      {userDetail.requestLimit >= 1000000
                        ? `${(userDetail.requestLimit / 1000000).toFixed(1)}M`
                        : `${(userDetail.requestLimit / 1000).toFixed(0)}K`
                      } tokens
                    </span>
                  </div>
                )}
                {userDetail?.tokenMonthlyUsed !== undefined && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Monthly Tokens Used</span>
                    <span className="text-sm text-gray-900">
                      {userDetail.tokenMonthlyUsed >= 1000000
                        ? `${(userDetail.tokenMonthlyUsed / 1000000).toFixed(1)}M`
                        : `${(userDetail.tokenMonthlyUsed / 1000).toFixed(0)}K`
                      } tokens
                    </span>
                  </div>
                )}

                {/* Refund Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefundRequest}
                    className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <RefreshCw className="w-4 h-4" />
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