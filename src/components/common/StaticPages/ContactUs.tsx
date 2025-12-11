import { useState } from 'react';
import { inquiryApi } from '../../../services/api';
import BackButton from '../BackButton';
import './StaticPages.scss';

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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
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
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit inquiry. Please try again.');
      console.error('Error submitting inquiry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="static-page-container">
        <div className="static-page-content">
        <div className="static-page-header">
          <BackButton />
        </div>
        <h1 className="static-page-title">Contact Us</h1>
        
        <section className="static-page-section">
          <h2>Get in Touch</h2>
          <p>
            We're here to help! If you have any questions, concerns, or feedback, please don't hesitate to reach out to us.
          </p>
        </section>

        <section className="static-page-section">
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

        <section className="static-page-section">
          <h2>Send Us a Message</h2>
          {submitted ? (
            <div className="contact-success">
              <p>Thank you for contacting us! We'll get back to you soon.</p>
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

              <button 
                type="submit" 
                className="contact-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </section>

        <section className="static-page-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-section">
            <div className="faq-item">
              <h3>How do I reset my password?</h3>
              <p>You can reset your password from the login page by clicking "Forgot Password" and following the instructions sent to your email.</p>
            </div>
            <div className="faq-item">
              <h3>How long does it take to process refunds?</h3>
              <p>Refunds are typically processed within 5-7 business days. See our <a href="/cancellation-refunds">Cancellation & Refunds Policy</a> for more details.</p>
            </div>
            <div className="faq-item">
              <h3>Can I participate in multiple tournaments?</h3>
              <p>Yes! You can participate in multiple tournaments as long as they don't overlap in time.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactUs;
