import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inquiryApi } from '@services/api';
import StaticLandingLayout from './StaticLandingLayout';
import { STATIC_ROUTES } from '@utils/constants';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await inquiryApi.submitInquiry(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaticLandingLayout
      title="Contact Us"
      description="Have questions or need support? Contact the BooyahX team. We are here to help you with tournament queries, technical issues, and platform feedback."
      showBackButton
    >
      <section className="sl-section">
        <h2>Get in Touch</h2>
        <p>
          We&apos;re here to help! If you have any questions, concerns, or feedback, please don&apos;t hesitate to reach out to us.
        </p>
      </section>

      <section className="sl-section">
        <h2>Contact Information</h2>
        <div className="contact-info">
          <div className="contact-item">
            <h3>Email</h3>
            <p>support@gaminghuballday.buzz</p>
          </div>
          <div className="contact-item">
            <h3>Business Hours</h3>
            <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
            <p>Saturday - Sunday: 10:00 AM - 4:00 PM IST</p>
          </div>
          <div className="contact-item">
            <h3>Response Time</h3>
            <p>We aim to respond to all inquiries within 24-48 hours.</p>
          </div>
        </div>
      </section>

      <section className="sl-section">
        <h2>Send Us a Message</h2>
        {submitted ? (
          <div className="contact-success">
            <p>Thank you for contacting us! We&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            {error && (
              <div className="contact-error">
                <p>{error}</p>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing/Payment</option>
                <option value="tournament">Tournament Related</option>
                <option value="refund">Refund Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Please provide details about your inquiry..."
              />
            </div>
            <button type="submit" className="contact-submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </section>

      <section className="sl-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-section">
          <div className="faq-item">
            <h3>How do I reset my password?</h3>
            <p>
              You can reset your password from the login page by clicking &quot;Forgot Password&quot; and following the instructions sent to your email.
            </p>
          </div>
          <div className="faq-item">
            <h3>How long does it take to process refunds?</h3>
            <p>
              Refunds are typically processed within 5-7 business days. See our{' '}
              <Link to={STATIC_ROUTES.CANCELLATION_REFUNDS}>Cancellation & Refunds Policy</Link> for more details.
            </p>
          </div>
          <div className="faq-item">
            <h3>Can I participate in multiple tournaments?</h3>
            <p>Yes! You can participate in multiple tournaments as long as they don&apos;t overlap in time.</p>
          </div>
        </div>
      </section>
    </StaticLandingLayout>
  );
};

export default ContactUs;
