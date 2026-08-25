'use client';

import { useState, type SyntheticEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import type { ContactStatus } from '../../content/portfolio';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY: string =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.PUBLIC_WEB3FORMS_KEY ?? '';

export default function ContactForm() {
  const [status, setStatus] = useState<ContactStatus>('idle');

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setStatus('invalid');
      return;
    }

    if (!WEB3FORMS_ACCESS_KEY) {
      setStatus('error');
      return;
    }

    const data = new FormData(form);
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
      botcheck: String(data.get('botcheck') ?? ''),
      from_name: 'davisk.dev portfolio',
    };

    setStatus('sending');
    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success?: boolean };
      if (response.ok && result.success) {
        form.reset();
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
      <div className="field-wrap">
        <Label className="sr-only" htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          aria-label="Name"
          required
        />
      </div>
      <div className="field-wrap">
        <Label className="sr-only" htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email"
          required
        />
      </div>
      <div className="field-wrap">
        <Label className="sr-only" htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="What are you building?"
          aria-label="Message"
          required
        />
      </div>
      <input
        type="text"
        name="botcheck"
        className="form-honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <Button className="contact-submit" type="submit" disabled={status === 'sending'}>
        <span>{status === 'sending' ? 'SENDING…' : 'SEND MESSAGE'}</span>
        <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
      </Button>
      <p className="form-status" aria-live="polite">
        {status === 'invalid'
          ? 'Fill in all three fields, and make sure the email is real.'
          : status === 'sending'
            ? 'Sending your message…'
            : status === 'success'
              ? 'Thanks, it’s on its way. I reply within 48 hours.'
              : status === 'error'
                ? 'The form didn’t go through. Try again, or reach me on LinkedIn.'
                : ''}
      </p>
    </form>
  );
}
