'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载状态，给用户更好的体验
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#64748b',
            marginBottom: '1rem'
          }}>
            Processing your subscription...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          🎉 Payment Successful!
        </div>

        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          Thank you for subscribing! Your subscription is now active.
        </p>

        {sessionId && (
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            color: '#374151'
          }}>
            <strong>Session ID:</strong> {sessionId}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Back to Pricing
          </button>

          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go to Dashboard
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          <p>You will receive a confirmation email shortly.</p>
        </div>
      </div>
    </div>
  );
}