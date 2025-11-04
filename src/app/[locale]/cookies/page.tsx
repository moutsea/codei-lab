import { Cookie, Settings, Shield, Eye, Clock, CheckCircle, AlertTriangle, Smartphone } from "lucide-react";
import Footer from "@/components/footer";
import Header from "@/components/header";

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn how Claude-ide uses cookies and other tracking technologies to improve your experience on our website. Manage your cookie preferences easily.'
}


export default function CookiePolicyPage() {

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Cookie className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This policy explains how Claude IDE uses cookies and similar technologies to enhance your experience and provide our services.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* What Are Cookies */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-amber-600" />
              What Are Cookies?
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Key Points:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Cookies are harmless and cannot damage your computer</li>
                  <li>They cannot be used to identify you personally</li>
                  <li>Most web browsers accept cookies automatically</li>
                  <li>You can control cookies through your browser settings</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Cookies */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              How We Use Cookies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We use cookies for various purposes to enhance your experience:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essential Functionality:</strong> To enable basic features like user authentication and session management</li>
                <li><strong>Preferences:</strong> To remember your settings, language preferences, and customization choices</li>
                <li><strong>Security:</strong> To protect against fraud and ensure secure access to your account</li>
                <li><strong>Analytics:</strong> To understand how our service is used and improve performance</li>
                <li><strong>Personalization:</strong> To provide relevant content and features based on your usage patterns</li>
              </ul>
            </div>
          </section>

          {/* Types of Cookies We Use */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-green-600" />
              Types of Cookies We Use
            </h2>
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-red-500" />
                  Essential Cookies
                </h3>
                <p className="text-muted-foreground mb-2">
                  These cookies are necessary for the website to function and cannot be switched off in our systems.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <p><strong>Purpose:</strong> Authentication, security, session management</p>
                  <p><strong>Duration:</strong> Session-based or persistent as needed</p>
                  <p><strong>Required:</strong> Yes - without these cookies, the service cannot function properly</p>
                </div>
              </div>

              {/* Performance Cookies */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Performance & Analytics Cookies
                </h3>
                <p className="text-muted-foreground mb-2">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <p><strong>Purpose:</strong> Analytics, usage statistics, performance monitoring</p>
                  <p><strong>Duration:</strong> Typically 30 days to 2 years</p>
                  <p><strong>Required:</strong> No - can be disabled without affecting functionality</p>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-500" />
                  Functional Cookies
                </h3>
                <p className="text-muted-foreground mb-2">
                  These cookies enable enhanced functionality and personalization, such as videos and live chats.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <p><strong>Purpose:</strong> Preferences, customization, enhanced features</p>
                  <p><strong>Duration:</strong> Varies, typically 1 year</p>
                  <p><strong>Required:</strong> No - disabling may affect some personalized features</p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-purple-500" />
                  Marketing Cookies
                </h3>
                <p className="text-muted-foreground mb-2">
                  These cookies are used to deliver advertisements that are relevant to you and your interests.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <p><strong>Purpose:</strong> Advertising, remarketing, cross-site tracking</p>
                  <p><strong>Duration:</strong> Varies, typically 30 days to 1 year</p>
                  <p><strong>Required:</strong> No - we use minimal marketing cookies</p>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-purple-600" />
              Third-Party Cookies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We use some third-party services that may set their own cookies on your device when you interact with our service:
              </p>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Auth0 (Authentication)</h4>
                  <p className="text-sm">Manages user authentication and secure login sessions</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Stripe (Payment Processing)</h4>
                  <p className="text-sm">Handles secure payment processing and subscription management</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Analytics Services</h4>
                  <p className="text-sm">Provide insights into service usage and performance</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cookie Duration */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-600" />
              Cookie Duration and Expiration
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Cookies have different lifespans depending on their purpose:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
                <li><strong>Authentication Cookies:</strong> Typically expire after 7-30 days for security</li>
                <li><strong>Analytics Cookies:</strong> Usually last 30 days to 2 years</li>
                <li><strong>Preference Cookies:</strong> Often set to expire after 1 year</li>
              </ul>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Managing Your Cookie Preferences
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You have several options to manage cookies:</p>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Browser Settings</h3>
                <p>Most browsers allow you to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>View what cookies are stored</li>
                  <li>Delete individual cookies or all cookies</li>
                  <li>Block cookies from specific websites</li>
                  <li>Block third-party cookies</li>
                  <li>Receive notifications when cookies are set</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Important Note
                </h3>
                <p className="text-amber-700">
                  Blocking or deleting cookies may affect your experience on our website. Some features may not work properly, and you may need to re-enter preferences or login information.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Browser-Specific Instructions</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</p>
                  <p><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</p>
                  <p><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</p>
                  <p><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cookie Consent */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Cookie Consent and Your Choices
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                When you first visit Claude IDE, you&apos;ll see a cookie consent banner that allows you to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Accept All Cookies:</strong> Enable all cookies for the best experience</li>
                <li><strong>Accept Essential Only:</strong> Only enable necessary cookies for basic functionality</li>
                <li><strong>Customize Settings:</strong> Choose which types of cookies to enable</li>
                <li><strong>Manage Preferences:</strong> Change your cookie settings at any time</li>
              </ul>
              <p className="mt-4">
                Your preferences are stored in a cookie so we don&apos;t ask you again on subsequent visits.
              </p>
            </div>
          </section>

          {/* Updates to This Policy */}
          <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Updates to This Cookie Policy
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Post the updated policy on our website</li>
                <li>Update the &quot;Last updated&quot; date at the top of this policy</li>
                <li>Notify users of significant changes through our service</li>
              </ul>
              <p className="mt-4">
                Your continued use of Claude IDE after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-red-600" />
              Contact Us
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about this Cookie Policy or how we use cookies, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> <a href="mailto:cfjwlchangji@gmail.com" className="text-blue-600 hover:underline">cfjwlchangji@gmail.com</a></p>
                <p className="mt-2"><strong>Response Time:</strong> We typically respond within 24-48 hours</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-muted-foreground">
          <p>Thank you for taking the time to understand how we use cookies. Your privacy and control over your data are important to us.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}