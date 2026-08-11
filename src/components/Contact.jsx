import "./Contact.css";
import { useState } from "react";
import { CONTACT } from "../data/site";
import { validateForm } from "../utils/validation";

export default function Contact({ registerReveal, onToast }) {
  const [formStatus, setFormStatus] = useState("idle");
  const [formErrors, setFormErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const errors = validateForm(data);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormStatus("error");
      onToast("A few details need a second look, check the highlighted fields below.");
      return;
    }

    setFormErrors({});
    setFormStatus("sending");

    try {
      const res = await fetch("/api/contact", { method: "POST", body: data });
      if (!res.ok) {
        // 422 means the server's own validation caught something the
        // client-side check above missed (defense in depth, not expected
        // in normal use) — anything else is a real send failure.
        if (res.status === 422) {
          const { errors: serverErrors } = await res.json().catch(() => ({ errors: {} }));
          setFormErrors(serverErrors);
        }
        throw new Error("send failed");
      }
      setFormStatus("sent");
      form.reset();
    } catch {
      setFormStatus("idle");
      onToast("Something went wrong sending your message. Please try again or call/email us directly.");
    }
  }

  return (
    <section className="hp-section" id="contact">
      <div className="hp-section__inner">
        <div className="hp-glass hp-contact__grid">
          <div className="hp-contact__info">
            <p className="hp-section__eyebrow hp-reveal" ref={registerReveal}>Contact us</p>
            <h2 className="hp-reveal" ref={registerReveal}>Email now for more information</h2>
            <p className="hp-panel-section__desc hp-reveal" ref={registerReveal}>Better yet, see us in person! We love our customers, so feel free to visit during normal business hours.</p>
            <ul className="hp-contact__details hp-reveal" ref={registerReveal}>
              <li>
                <strong>Address</strong>
                <span>{CONTACT.address}</span>
              </li>
              <li>
                <strong>Phone</strong>
                <span><a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a></span>
              </li>
              <li>
                <strong>Email</strong>
                <span><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></span>
              </li>
            </ul>
          </div>

          {formStatus === "sent" ? (
            <div className="hp-form-success hp-reveal" ref={registerReveal} role="status" aria-live="polite">
              <p className="hp-form-success__title">Message sent!</p>
              <p>Thanks for reaching out. Our team will get back to you within one business day.</p>
              <button type="button" className="hp-btn hp-btn--ghost" onClick={() => { setFormStatus("idle"); setFormErrors({}); }}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="hp-contact__form hp-reveal" ref={registerReveal} onSubmit={handleSubmit} noValidate>
              <label htmlFor="f-name">Name <span aria-hidden="true">*</span></label>
              <input id="f-name" type="text" name="name" autoComplete="name" aria-required="true" aria-describedby={formErrors.name ? "f-name-err" : undefined} aria-invalid={!!formErrors.name} />
              {formErrors.name && <span id="f-name-err" className="hp-field-error" role="alert">{formErrors.name}</span>}

              <label htmlFor="f-email">Email <span aria-hidden="true">*</span></label>
              <input id="f-email" type="email" name="email" autoComplete="email" aria-required="true" aria-describedby={formErrors.email ? "f-email-err" : undefined} aria-invalid={!!formErrors.email} />
              {formErrors.email && <span id="f-email-err" className="hp-field-error" role="alert">{formErrors.email}</span>}

              <label htmlFor="f-phone">Phone <span aria-hidden="true">*</span></label>
              <input id="f-phone" type="tel" name="phone" autoComplete="tel" aria-required="true" aria-describedby={formErrors.phone ? "f-phone-err" : undefined} aria-invalid={!!formErrors.phone} />
              {formErrors.phone && <span id="f-phone-err" className="hp-field-error" role="alert">{formErrors.phone}</span>}

              <label htmlFor="f-message">Message</label>
              <textarea id="f-message" name="message" rows={4} />

              <label htmlFor="f-attachment">Attach floor plan for a quote (max 10MB)</label>
              <input
                id="f-attachment"
                type="file"
                name="attachment"
                accept=".pdf,.dwg,.png,.jpg,.jpeg"
                className="hp-file-input"
                aria-describedby={formErrors.attachment ? "f-attachment-err" : undefined}
                aria-invalid={!!formErrors.attachment}
              />
              {formErrors.attachment && <span id="f-attachment-err" className="hp-field-error" role="alert">{formErrors.attachment}</span>}

              <button type="submit" className="hp-btn hp-btn--primary" disabled={formStatus === "sending"}>
                {formStatus === "sending" ? "Sending…" : "Send message"}
              </button>
              <p className="hp-contact__legal">By submitting this form you agree to be contacted by US Panels regarding your inquiry.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
