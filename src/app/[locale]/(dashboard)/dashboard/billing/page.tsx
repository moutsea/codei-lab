"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "next-auth/react";
import { useUserData } from "@/hooks/useUserData";
import type { PaymentSelect } from "@/types/schema";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const { isActive, loading: userLoading } = useUserData({ enableCache: true });

  const t = useTranslations("sidebar");
  const billingT = useTranslations("sidebar.billingPage");

  // State for pagination
  const [payments, setPayments] = useState<PaymentSelect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const locale = useLocale();
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(10);
  const [orderBy, setOrderBy] = useState<'createdAt' | 'amount' | 'status'>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch payments data
  const fetchPayments = async () => {
    if (!isActive) {
      window.location.assign(locale === 'en' ? '/' : `/${locale}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        orderBy,
        orderDirection
      });

      const response = await fetch(`/api/billing?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setPayments(result.payments);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(billingT("error"));
    } finally {
      setLoading(false);
    }
  };

  // Initial load and page/order changes
  useEffect(() => {
    if (user && !isLoading && !userLoading && isActive) {
      fetchPayments();
    }
  }, [user, isLoading, isActive, page, limit, orderBy, orderDirection]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSort = (field: 'createdAt' | 'amount' | 'status') => {
    if (orderBy === field) {
      setOrderDirection(orderDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setOrderBy(field);
      setOrderDirection('desc');
    }
    setPage(1);
  };

  // Format date
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get payment type display
  const getPaymentTypeDisplay = (type: string) => {
    try {
      return billingT(`paymentTypes.${type}`);
    } catch (error) {
      return type;
    }
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    try {
      return billingT(`statuses.${status}`);
    } catch (error) {
      return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'text-green-700 bg-green-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'cancelled':
        return 'text-gray-700 bg-gray-100';
      case 'refunded':
        return 'text-purple-700 bg-purple-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '✓';
      case 'failed':
        return '✗';
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'cancelled':
        return '✕';
      case 'refunded':
        return '↩️';
      default:
        return '❓';
    }
  };


  // Show loading while checking authentication
  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // console.log(user, isActive);
  // Redirect to login if not authenticated
  if (!isActive) {
    window.location.assign(locale === 'en' ? '/dashboard' : `/${locale}/dashboard`);
    return null;
  }

  return (
    <DashboardLayout
      pageTitle={t("billing")}
      pageSubtitle="View your payment history and billing information"
      hasActiveSubscription={isActive}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{billingT("title")}</h1>
            <p className="text-muted-foreground mt-2">{billingT("subtitle")}</p>
          </div>
        </div>


        {/* Payment History */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-foreground">{billingT("subtitle")}</CardTitle>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                className="border border-input bg-background px-3 py-1 rounded-md text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <div className="text-gray-600">{billingT("loading")}</div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-600 mb-4">Error: {error}</div>
                  <Button onClick={fetchPayments} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{billingT("noPayments")}</h3>
                <p className="text-muted-foreground">
                  You haven't made any payments yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center gap-1">
                          {billingT("date")}
                          {orderBy === 'createdAt' && (
                            orderDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('amount')}>
                        <div className="flex items-center gap-1">
                          {billingT("amount")}
                          {orderBy === 'amount' && (
                            orderDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">
                        {billingT("type")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1">
                          {billingT("status")}
                          {orderBy === 'status' && (
                            orderDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {payment.currency?.toUpperCase() || 'USD'} {parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                          {getPaymentTypeDisplay(payment.type || '')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status || '')}`}>
                            <span className="mr-1">{getStatusIcon(payment.status || '')}</span>
                            {getStatusDisplay(payment.status || '')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}