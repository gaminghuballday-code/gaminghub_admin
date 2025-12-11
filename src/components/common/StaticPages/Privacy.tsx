import BackButton from '../BackButton';
import './StaticPages.scss';

const Privacy: React.FC = () => {
  return (
    <div className="static-page-container">
      <div className="static-page-content">
        <div className="static-page-header">
          <BackButton />
        </div>
        <h1 className="static-page-title">Privacy Policy</h1>
        
        <section className="static-page-section">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, username, password, and profile information</li>
            <li><strong>Payment Information:</strong> Payment method details (processed securely through our payment partners)</li>
            <li><strong>Gaming Data:</strong> Tournament participation, game history, scores, and achievements</li>
            <li><strong>Communication Data:</strong> Messages, support requests, and feedback you send to us</li>
            <li><strong>Technical Data:</strong> IP address, device information, browser type, and usage patterns</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the collected information for the following purposes:
          </p>
          <ul>
            <li>To provide, maintain, and improve our services</li>
            <li>To process transactions and manage your account</li>
            <li>To communicate with you about your account, tournaments, and platform updates</li>
            <li>To personalize your gaming experience</li>
            <li>To detect and prevent fraud, abuse, and security issues</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform (payment processors, hosting services, etc.)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="static-page-section">
          <h2>5. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to:
          </p>
          <ul>
            <li>Remember your preferences and settings</li>
            <li>Analyze how you use our platform</li>
            <li>Provide personalized content and advertisements</li>
            <li>Improve our services and user experience</li>
          </ul>
          <p>
            You can control cookies through your browser settings, but this may affect platform functionality.
          </p>
        </section>

        <section className="static-page-section">
          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Objection:</strong> Object to certain processing of your information</li>
            <li><strong>Portability:</strong> Request transfer of your information to another service</li>
            <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>7. Children's Privacy</h2>
          <p>
            Our services are not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </section>

        <section className="static-page-section">
          <h2>8. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we will securely delete or anonymize it.
          </p>
        </section>

        <section className="static-page-section">
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
          </p>
        </section>

        <section className="static-page-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="static-page-section">
          <h2>11. Contact</h2>
          <p>
            For questions about this privacy policy or to exercise your rights, please contact us at <a href="/contact-us">Contact Us</a>.
          </p>
          <p className="static-page-updated">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
