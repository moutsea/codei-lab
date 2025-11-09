import { FileText, Users, AlertCircle, Shield, CreditCard, Clock, Gavel, Heart } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/footer";
import Header from "@/components/header";


import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Review the terms and conditions for using Code I Lab. By using our service, you agree to our terms and policies.'
}


export default function TermsPage() {

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            These terms govern your use of Code I Lab. By using our affordable OpenAI Codex API access service, you agree to these terms and conditions.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Acceptance of Terms */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Acceptance of Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                By accessing and using Code I Lab, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          {/* Description of Service */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              Description of Service
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Code I Lab provides affordable OpenAI Codex API access that enables:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Advanced code generation through OpenAI's Codex model</li>
                <li>Cost-effective token-based API access for developers</li>
                <li>Integration with existing development workflows and IDEs</li>
                <li>Multiple API key management for teams and projects</li>
                <li>Flexible subscription plans for different usage needs</li>
              </ul>
              <p className="mt-4">
                The service is provided on a subscription basis with different tiers offering varying levels of API access and token quotas.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              User Responsibilities
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>As a user of Code I Lab, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Codex API access for legitimate development and coding purposes</li>
                <li>Not attempt to reverse engineer, decompile, or disassemble any part of the service</li>
                <li>Not use the API to generate malicious, harmful, or illegal code</li>
                <li>Not violate any applicable laws or regulations in your API usage</li>
                <li>Not interfere with or disrupt the Code I Lab service or servers</li>
                <li>Maintain the security of your account, API keys, and authentication credentials</li>
                <li>Not share your API keys or account credentials with unauthorized users</li>
                <li>Report any security vulnerabilities or bugs responsibly</li>
                <li>Monitor your API usage and stay within your plan's token limits</li>
              </ul>
            </div>
          </section>

          {/* Privacy and Data Protection */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Privacy and Data Protection
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Your privacy is important to us. Our use and protection of your information is governed by our Privacy Policy, which forms part of these terms. By using Code I Lab, you consent to the collection and use of information as described in our Privacy Policy.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Important:</strong> Please review our Privacy Policy at <Link href="/privacy" className="text-blue-600 hover:underline">/privacy</Link> to understand how we handle your data.</p>
              </div>
            </div>
          </section>

          {/* Subscription and Payment */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              Subscription and Payment Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Subscription Plans</h3>
                <p>Code I Lab offers various subscription plans with different API access levels and token quotas. You can view current plans and pricing on our website.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Payment Terms</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Payments are processed securely through Stripe</li>
                  <li>Subscriptions are billed monthly, quarterly, or annually based on your selected plan</li>
                  <li>You will be billed in advance on a recurring basis</li>
                  <li>All prices are listed in your local currency where applicable</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Refund Policy</h3>
                <p>We offer a 14-day money-back guarantee for new subscriptions. After 14 days, refunds are provided at our discretion and may be prorated.</p>
              </div>
            </div>
          </section>

          {/* Cancellation and Termination */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              Cancellation and Termination
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">By You</h3>
                <p>You may cancel your subscription at any time through your account settings or by contacting our support team. Cancellation will take effect at the end of the current billing period, and you will continue to have access until then.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">By Us</h3>
                <p>We reserve the right to suspend or terminate your account if you violate these terms, engage in fraudulent activity, or use the service inappropriately. We will provide notice before termination where possible.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Effect of Termination</h3>
                <p>Upon termination, your right to use the service will cease immediately, and we may delete your account data in accordance with our privacy policy and legal requirements.</p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-red-600" />
              Intellectual Property
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Our Rights</h3>
                <p>Code I Lab and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Rights</h3>
                <p>You retain ownership of any code you create using Code I Lab's Codex API access. However, you grant us a limited license to use your code and feedback to improve our service, as described in our Privacy Policy.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Generated Content</h3>
                <p>Code and content generated through Code I Lab's Codex API access is provided to you under our terms, but you are responsible for ensuring it meets your requirements and complies with applicable laws.</p>
              </div>
            </div>
          </section>

          {/* Disclaimers and Limitations */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              Disclaimers and Limitations
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Service Availability</h3>
                <p>We strive to maintain high availability but cannot guarantee uninterrupted service. The service may be temporarily unavailable due to maintenance, updates, or technical issues.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">AI Accuracy</h3>
                <p>Code I Lab provides access to OpenAI's advanced Codex model, but generated code may contain errors or bugs. You are responsible for testing, reviewing, and validating all code before use in production environments.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Limitation of Liability</h3>
                <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of or relating to these terms or the service.</p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-emerald-600" />
              Governing Law and Disputes
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is based, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these terms or the service will be resolved through good faith negotiations. If we cannot resolve the dispute, it will be resolved through binding arbitration in accordance with the rules of the relevant arbitration association.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Changes to These Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. We will notify users of material changes via email or prominent notices on our website.
              </p>
              <p>
                Your continued use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-600" />
              Contact Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about these Terms of Service, please contact us:
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
          <p>Thank you for choosing Code I Lab. We&apos;re committed to providing you with affordable and reliable OpenAI Codex API access for your development needs.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}