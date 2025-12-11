import './StaticPages.scss';

const TermsConditions: React.FC = () => {
  return (
    <div className="static-page-container">
      <div className="static-page-content">
        <h1 className="static-page-title">Terms and Conditions</h1>
        
        <section className="static-page-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="static-page-section">
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily use our platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>3. User Accounts</h2>
          <p>
            Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information when creating an account</li>
            <li>Keep your account information updated</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Not share your account credentials with others</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>4. Tournament Participation</h2>
          <p>
            By participating in tournaments, you agree to:
          </p>
          <ul>
            <li>Follow all tournament rules and guidelines</li>
            <li>Maintain fair play and sportsmanship</li>
            <li>Not engage in cheating, hacking, or any form of unfair advantage</li>
            <li>Accept the decisions of tournament administrators as final</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>5. Payment Terms</h2>
          <p>
            All payments are processed securely through our payment partners. By making a payment, you agree to:
          </p>
          <ul>
            <li>Provide accurate payment information</li>
            <li>Authorize charges for tournament entry fees and other services</li>
            <li>Understand that all sales are final unless otherwise stated in our refund policy</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>6. Prohibited Activities</h2>
          <p>
            Users are prohibited from:
          </p>
          <ul>
            <li>Engaging in any illegal activities</li>
            <li>Harassing, threatening, or abusing other users</li>
            <li>Posting offensive, defamatory, or inappropriate content</li>
            <li>Attempting to gain unauthorized access to the platform</li>
            <li>Interfering with the platform's security or functionality</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>7. Intellectual Property</h2>
          <p>
            All content on this platform, including but not limited to text, graphics, logos, and software, is the property of the platform or its content suppliers and is protected by copyright and other intellectual property laws.
          </p>
        </section>

        <section className="static-page-section">
          <h2>8. Limitation of Liability</h2>
          <p>
            The platform shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section className="static-page-section">
          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the platform constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="static-page-section">
          <h2>10. Contact</h2>
          <p>
            For questions about these terms, please contact us at <a href="/contact-us">Contact Us</a>.
          </p>
          <p className="static-page-updated">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsConditions;
