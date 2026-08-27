'use client';

import { useRef, useState, type SyntheticEvent } from 'react';
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

// Anti-scrape traps (spec §5): the honey-trap edge function flags the
// caller's IP in the same Blobs store the resume gate reads.
const HONEY_TRAP_URL = '/archive/resume-draft-v2.pdf';
const MIN_HUMAN_SUBMIT_MS = 2_000;

export default function ContactForm() {
  const [status, setStatus] = useState<ContactStatus>('idle');
  const mountedAt = useRef(Date.now());

  // Silent-drop path for bots: identical success UI, no network call, and no
  // signal about which defense tripped.
  function fakeSuccess(form: HTMLFormElement) {
    form.reset();
    setStatus('success');
  }

  // Fire-and-forget: the honey-trap edge function writes the 30-day IP flag
  // that the resume gate reads.
  function flagActor() {
    fetch(HONEY_TRAP_URL).catch(() => {});
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    // Hidden botcheck field filled → bot. Flag the IP and drop silently.
    if (String(new FormData(form).get('botcheck') ?? '') !== '') {
      flagActor();
      fakeSuccess(form);
      return;
    }

    if (!form.checkValidity()) {
      setStatus('invalid');
      return;
    }

    if (!WEB3FORMS_ACCESS_KEY) {
      setStatus('error');
      return;
    }

    // Valid form submitted within 2s of mount → almost certainly automated.
    // Silent drop only (no IP flag): a rare human false positive costs one
    // message, not a 30-day resume block.
    if (Date.now() - mountedAt.current < MIN_HUMAN_SUBMIT_MS) {
      fakeSuccess(form);
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
        <Label className="sr-only" htmlFor="contact-name">
          Name
        </Label>
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
        <Label className="sr-only" htmlFor="contact-email">
          Email
        </Label>
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
        <Label className="sr-only" htmlFor="contact-message">
          Message
        </Label>
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
      <Button
        className="contact-submit"
        type="submit"
        disabled={status === 'sending'}
      >
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
