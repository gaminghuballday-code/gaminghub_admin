import './StaticPages.scss';

const CancellationRefunds: React.FC = () => {
  return (
    <div className="static-page-container">
      <div className="static-page-content">
        <h1 className="static-page-title">Cancellation & Refunds Policy</h1>
        
        <section className="static-page-section">
          <h2>1. Cancellation Policy</h2>
          <p>
            Users may cancel their tournament registrations or transactions subject to the following terms:
          </p>
          <ul>
            <li>Cancellations must be requested at least 24 hours before the tournament start time.</li>
            <li>Late cancellations may be subject to processing fees.</li>
            <li>Refunds for cancelled registrations will be processed according to the refund policy below.</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>2. Refund Policy</h2>
          <p>
            Refunds are processed in the following scenarios:
          </p>
          <ul>
            <li><strong>Full Refund:</strong> Cancellations made 24+ hours before tournament start time.</li>
            <li><strong>Partial Refund:</strong> Cancellations made within 24 hours of tournament start time (50% refund).</li>
            <li><strong>No Refund:</strong> Cancellations made after tournament has started or completed.</li>
            <li><strong>Tournament Cancellation:</strong> If a tournament is cancelled by the host, full refunds will be issued to all participants.</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>3. Refund Processing</h2>
          <p>
            Refunds will be processed to the original payment method within 5-7 business days. Processing times may vary based on your payment provider.
          </p>
        </section>

        <section className="static-page-section">
          <h2>4. Dispute Resolution</h2>
          <p>
            If you have any concerns regarding cancellations or refunds, please contact our support team through the Contact Us page. We aim to resolve all disputes within 48 hours.
          </p>
        </section>

        <section className="static-page-section">
          <h2>5. Contact</h2>
          <p>
            For questions about this policy, please contact us at <a href="/contact-us">Contact Us</a>.
          </p>
          <p className="static-page-updated">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
};

export default CancellationRefunds;
