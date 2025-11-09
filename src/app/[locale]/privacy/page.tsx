import { Shield, Eye, Lock, Database, UserCheck, Cookie, Mail, Globe } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";


import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Code I Lab collects, uses, and protects your personal data. Your privacy is important to us, and we are committed to safeguarding it.'
}


export default function PrivacyPage() {

  return (

    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use Code I Lab for affordable OpenAI Codex API access.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              What We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We collect information necessary to provide and improve our affordable OpenAI Codex API access service. This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, and authentication details when you create an account</li>
                <li><strong>Usage Data:</strong> API requests, token usage statistics, and interaction patterns to improve our service</li>
                <li><strong>Technical Data:</strong> IP address, device information, browser type, and access times for security and analytics</li>
                <li><strong>Payment Information:</strong> Billing details processed securely through our payment partners (Stripe)</li>
                <li><strong>Communication Data:</strong> Support emails and chat transcripts when you contact us for help</li>
              </ul>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-green-600" />
              How We Use Your Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain Code I Lab Codex API access services</li>
                <li>Process payments and manage Code I Lab subscriptions</li>
                <li>Improve our Codex API service quality and performance</li>
                <li>Monitor API usage and prevent abuse</li>
                <li>Provide customer support for development workflow issues</li>
                <li>Send important service updates and security notices</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-purple-600" />
              Data Security & Protection
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication systems prevent unauthorized access</li>
                <li><strong>Regular Audits:</strong> We conduct regular security audits and penetration testing</li>
                <li><strong>Data Minimization:</strong> We only collect data necessary for service provision</li>
                <li><strong>Secure Infrastructure:</strong> Our infrastructure is hosted on secure, compliant cloud platforms</li>
              </ul>
            </div>
          </section>

          {/* User Rights */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-orange-600" />
              Your Rights & Choices
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to processing of your data in certain circumstances</li>
                <li><strong>Restriction:</strong> Limit how we use your information</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at: <a href="mailto:cfjwlchangji@gmail.com" className="text-blue-600 hover:underline">cfjwlchangji@gmail.com</a>
              </p>
            </div>
          </section>

          {/* Cookies & Tracking */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-yellow-600" />
              Cookies & Tracking Technologies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for basic Code I Lab functionality and API authentication</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how our Codex API service is used</li>
                <li><strong>Preference Cookies:</strong> Remember your Code I Lab settings and development preferences</li>
                <li><strong>Security Cookies:</strong> Help protect your API keys and prevent unauthorized access</li>
              </ul>
              <p className="mt-4">
                You can control cookie settings through your browser preferences.
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-600" />
              Third-Party Services
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We work with trusted third-party service providers:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Payment Processing:</strong> For secure Code I Lab subscription management (PCI DSS compliant)</li>
                <li><strong>Authentication Services:</strong> For user authentication and secure API key management</li>
                <li><strong>Cloud Providers:</strong> For hosting Code I Lab infrastructure services</li>
                <li><strong>Analytics Services:</strong> For Codex API usage monitoring and service improvement</li>
              </ul>
              <p className="mt-4">
                These services are bound by confidentiality agreements and data protection standards.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-teal-600" />
              International Data Transfers
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Standard Contractual Clauses (SCCs) where required</li>
                <li>Adequacy decisions for approved countries</li>
                <li>Technical and organizational security measures</li>
                <li>Compliance with applicable data protection laws</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-red-600" />
              Contact Us
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have questions about this Privacy Policy or how we handle your information, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> <a href="mailto:cfjwlchangji@gmail.com" className="text-blue-600 hover:underline">cfjwlchangji@gmail.com</a></p>
                <p className="mt-2"><strong>Response Time:</strong> We typically respond within 24-48 hours</p>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-semibold mb-4">Policy Updates</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications for significant changes</li>
                <li>Displaying prominent notices on our service</li>
              </ul>
              <p className="mt-4">
                Your continued use of Code I Lab after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-muted-foreground">
          <p>Thank you for trusting Code I Lab with your data. We are committed to protecting your privacy as we provide affordable OpenAI Codex API access to developers worldwide.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}