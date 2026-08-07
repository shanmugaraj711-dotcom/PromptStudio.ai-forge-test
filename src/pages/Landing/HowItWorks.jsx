import SectionHeading from '../../components/common/SectionHeading';

const steps = [
  {
    number: '01',
    title: 'Describe your idea',
    description: 'Tell PromptStudio what you want AI to help you create.',
  },
  {
    number: '02',
    title: 'PromptStudio optimizes it',
    description: 'We restructure your idea into a professional, high-quality prompt.',
  },
  {
    number: '03',
    title: 'Paste into your favorite AI',
    description: 'Copy the result into ChatGPT, Claude, Gemini or Grok and get better output.',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Process"
          title="How it works"
          subtitle="Three simple steps between your idea and a professional prompt."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-md">
                {step.number}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>

              {index < steps.length - 1 && (
                <div className="mt-6 hidden md:flex md:items-center md:justify-center">
                  <svg
                    className="h-6 w-6 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
