import BackButton from '../BackButton';
import './StaticPages.scss';

const Shipping: React.FC = () => {
  return (
    <div className="static-page-container">
      <div className="static-page-content">
        <div className="static-page-header">
          <BackButton />
        </div>
        <h1 className="static-page-title">Shipping Policy</h1>
        
        <section className="static-page-section">
          <h2>1. Digital Services</h2>
          <p>
            Our platform primarily offers digital gaming services including tournament participation, virtual credits, and online gaming experiences. These services are delivered instantly upon purchase and do not require physical shipping.
          </p>
        </section>

        <section className="static-page-section">
          <h2>2. Physical Products (if applicable)</h2>
          <p>
            In the event that we offer physical products (prizes, merchandise, etc.), the following shipping terms apply:
          </p>
          <ul>
            <li><strong>Processing Time:</strong> Physical products are typically processed within 3-5 business days after order confirmation.</li>
            <li><strong>Shipping Methods:</strong> We use reliable shipping partners to deliver products to your registered address.</li>
            <li><strong>Shipping Costs:</strong> Shipping costs, if applicable, will be clearly displayed during checkout.</li>
            <li><strong>Delivery Time:</strong> Standard delivery times range from 7-14 business days depending on your location.</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>3. Prize Delivery</h2>
          <p>
            For tournament prizes and rewards:
          </p>
          <ul>
            <li>Digital prizes (credits, vouchers) are credited to your account immediately upon tournament completion.</li>
            <li>Physical prizes will be shipped to the address provided in your account within 14-21 business days.</li>
            <li>Winners are responsible for providing accurate shipping information.</li>
            <li>We are not responsible for prizes lost due to incorrect address information.</li>
          </ul>
        </section>

        <section className="static-page-section">
          <h2>4. International Shipping</h2>
          <p>
            International shipping may be available for select products. Additional shipping charges and extended delivery times may apply. Customs duties and taxes are the responsibility of the recipient.
          </p>
        </section>

        <section className="static-page-section">
          <h2>5. Tracking</h2>
          <p>
            For physical shipments, tracking information will be provided via email once your order has been shipped. You can use this information to track your package through the carrier's website.
          </p>
        </section>

        <section className="static-page-section">
          <h2>6. Lost or Damaged Items</h2>
          <p>
            If your shipment is lost or arrives damaged, please contact us immediately through the Contact Us page. We will work with the shipping carrier to resolve the issue and arrange for replacement or refund as appropriate.
          </p>
        </section>

        <section className="static-page-section">
          <h2>7. Address Updates</h2>
          <p>
            Please ensure your shipping address is accurate and up-to-date in your account settings. Changes to shipping addresses after an order has been placed may not be possible if the order has already been processed.
          </p>
        </section>

        <section className="static-page-section">
          <h2>8. Contact</h2>
          <p>
            For questions about shipping, please contact us at <a href="/contact-us">Contact Us</a>.
          </p>
          <p className="static-page-updated">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Shipping;
