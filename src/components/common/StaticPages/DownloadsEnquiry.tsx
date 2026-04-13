import { type ChangeEvent, type FC, type FormEvent, useState } from 'react';
import { useSubmitInquiry } from '@services/api/hooks';
import type { InquiryRequest } from '@services/types/api.types';
import {
  INQUIRY_MESSAGE_MAX,
  INQUIRY_MESSAGE_MIN,
  validateInquiryMessage,
} from './DownloadsEnquiry.logic';
import { INQUIRY_SUBJECT_OPTIONS } from '@utils/inquirySubjects';
import './DownloadsEnquiry.scss';

const initialForm: InquiryRequest = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export const DownloadsEnquiry: FC = () => {
  const [form, setForm] = useState<InquiryRequest>(initialForm);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useSubmitInquiry();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'message' && messageError) setMessageError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const msgErr = validateInquiryMessage(form.message);
    if (msgErr) {
      setMessageError(msgErr);
      return;
    }
    setMessageError(null);

    const payload: InquiryRequest = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    mutate(payload, {
      onSuccess: () => {
        setSubmitted(true);
        setForm(initialForm);
      },
    });
  };

  return (
    <section className="dl-enquiry dl-r" id="enquire" aria-labelledby="dl-enquiry-heading">
      <div className="dl-wrap">
        <h2 className="dl-enquiry__title" id="dl-enquiry-heading">
          Send an enquiry
        </h2>
        <p className="dl-enquiry__subtitle">
          Questions about BooyahX, downloads, or tournaments? Leave your details — we&apos;ll get
          back to you by email.
        </p>

        <div className="dl-enquiry__panel">
          {submitted ? (
            <div className="dl-enquiry__success" role="status">
              <p>Thanks — your message was sent. We&apos;ll reply to the email you provided.</p>
              <button
                type="button"
                className="dl-enquiry__again"
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="dl-enquiry__field">
                <label className="dl-enquiry__label" htmlFor="dl-enquiry-name">
                  Name
                </label>
                <input
                  id="dl-enquiry-name"
                  className="dl-enquiry__input"
                  name="name"
                  type="text"
                  autoComplete="off"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>

              <div className="dl-enquiry__field">
                <label className="dl-enquiry__label" htmlFor="dl-enquiry-email">
                  Email
                </label>
                <input
                  id="dl-enquiry-email"
                  className="dl-enquiry__input"
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>

              <div className="dl-enquiry__field">
                <label className="dl-enquiry__label" htmlFor="dl-enquiry-subject">
                  Subject
                </label>
                <select
                  id="dl-enquiry-subject"
                  className="dl-enquiry__select"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option value="">Select a subject</option>
                  {INQUIRY_SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dl-enquiry__field">
                <label className="dl-enquiry__label" htmlFor="dl-enquiry-message">
                  Message
                </label>
                <textarea
                  id="dl-enquiry-message"
                  className="dl-enquiry__textarea"
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  minLength={INQUIRY_MESSAGE_MIN}
                  maxLength={INQUIRY_MESSAGE_MAX}
                  placeholder="Tell us what you need (10–5000 characters)"
                  aria-invalid={Boolean(messageError)}
                  aria-describedby="dl-enquiry-message-hint"
                />
                <p
                  id="dl-enquiry-message-hint"
                  className={`dl-enquiry__hint${messageError ? ' dl-enquiry__hint--error' : ''}`}
                >
                  {messageError ??
                    `${form.message.trim().length} / ${INQUIRY_MESSAGE_MIN}–${INQUIRY_MESSAGE_MAX} characters`}
                </p>
              </div>

              <button type="submit" className="dl-enquiry__submit" disabled={isPending}>
                {isPending ? 'Sending…' : 'Send enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
