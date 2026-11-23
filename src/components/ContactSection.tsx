import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  INQUIRY_SCOPES,
  validateInquiry,
  type InquiryErrors,
  type InquiryInput,
} from '../utils/inquiry';

interface ContactSectionProps {
  preferredScope?: string;
}

export function ContactSection({ preferredScope }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [scope, setScope] = useState<string>(preferredScope || 'Custom Website');
  const [brief, setBrief] = useState('');
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [submittedData, setSubmittedData] = useState<InquiryInput | null>(null);

  useEffect(() => {
    if (preferredScope) {
      setScope(preferredScope);
      setSubmittedData(null);
    }
  }, [preferredScope]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateInquiry({ name, email, scope, brief });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmittedData(validation.normalized);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setScope(preferredScope || 'Custom Website');
    setBrief('');
    setErrors({});
    setSubmittedData(null);
  };

  return (
    <section id="contact" className="py-16 lg:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-zinc-500 mb-2">Start a Project</p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900 text-balance mb-4">
              Tell us what you need built.
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 mb-8">
              Share your goals, timeline, or an existing URL you want rebuilt. We reply
              within one business day with a clear technical plan and fixed scope estimate.
            </p>

            <div className="pt-6 border-t border-zinc-200 space-y-3 text-sm text-zinc-600">
              <div>
                <span className="font-medium text-zinc-900">Direct email:</span>{' '}
                <a
                  href="mailto:hello@kestrel.studio"
                  className="hover:text-blue-800 hover:underline underline-offset-4"
                >
                  hello@kestrel.studio
                </a>
              </div>
              <div>
                <span className="font-medium text-zinc-900">Availability:</span> Booking
                new engagements for Q1 2027
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {submittedData ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-zinc-50 border border-zinc-200 rounded-xl p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />
                  <h3 className="text-xl font-semibold text-zinc-900">
                    Inquiry received for {submittedData.scope}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 mb-6">
                  Thank you, {submittedData.name}. We have logged your brief and will follow
                  up at <span className="font-medium text-zinc-900">{submittedData.email}</span>{' '}
                  within one business day.
                </p>

                <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6 text-sm text-zinc-700">
                  <div className="text-xs font-medium text-zinc-500 mb-1">Submitted Brief</div>
                  <p>{submittedData.brief}</p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 min-h-[40px] text-sm font-medium text-zinc-900 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="block text-sm font-medium text-zinc-900 mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="inquiry-name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        if (errors.name) {
                          setErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="Alex Mercer"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'inquiry-name-error' : undefined}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                    />
                    {errors.name && (
                      <p id="inquiry-name-error" className="mt-1.5 text-xs font-medium text-red-700">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-email"
                      className="block text-sm font-medium text-zinc-900 mb-1.5"
                    >
                      Work Email
                    </label>
                    <input
                      id="inquiry-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      placeholder="alex@company.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'inquiry-email-error' : undefined}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                    />
                    {errors.email && (
                      <p id="inquiry-email-error" className="mt-1.5 text-xs font-medium text-red-700">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-scope"
                    className="block text-sm font-medium text-zinc-900 mb-1.5"
                  >
                    Project Focus
                  </label>
                  <select
                    id="inquiry-scope"
                    name="scope"
                    value={scope}
                    onChange={(event) => {
                      setScope(event.target.value);
                      if (errors.scope) {
                        setErrors((prev) => ({ ...prev, scope: undefined }));
                      }
                    }}
                    aria-invalid={Boolean(errors.scope)}
                    aria-describedby={errors.scope ? 'inquiry-scope-error' : undefined}
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                  >
                    {INQUIRY_SCOPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {errors.scope && (
                    <p id="inquiry-scope-error" className="mt-1.5 text-xs font-medium text-red-700">
                      {errors.scope}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="inquiry-brief"
                    className="block text-sm font-medium text-zinc-900 mb-1.5"
                  >
                    Project Brief
                  </label>
                  <textarea
                    id="inquiry-brief"
                    name="brief"
                    rows={4}
                    value={brief}
                    onChange={(event) => {
                      setBrief(event.target.value);
                      if (errors.brief) {
                        setErrors((prev) => ({ ...prev, brief: undefined }));
                      }
                    }}
                    placeholder="Briefly describe your product, audience, and target launch date."
                    aria-invalid={Boolean(errors.brief)}
                    aria-describedby={errors.brief ? 'inquiry-brief-error' : undefined}
                    className="w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                  />
                  {errors.brief && (
                    <p id="inquiry-brief-error" className="mt-1.5 text-xs font-medium text-red-700">
                      {errors.brief}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                  >
                    Send Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
