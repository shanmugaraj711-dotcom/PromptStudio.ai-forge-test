import SectionHeading from '../../components/common/SectionHeading';

const BEFORE_EXAMPLE = 'Write email';

const AFTER_EXAMPLE = `Role:
Act as a professional HR communication expert.

Objective:
Help the user achieve the following goal: "Write email"

Context:
The user wants a high-quality result and needs the request framed as a clear, professional prompt.

Requirements:
- Use clear, engaging, and well-structured language.
- Maintain a tone appropriate for the intended audience.
- Avoid generic phrasing; be specific and original.

Expected Output:
A polished, ready-to-use piece of writing that matches the requested tone and format.`;

function BeforeAfter() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="See the difference"
          title="Before / After"
          subtitle="A simple idea becomes a professional, structured prompt."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Before
            </span>
            <p className="mt-4 text-sm font-medium text-gray-500 italic">
              "{BEFORE_EXAMPLE}"
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6 shadow-sm">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              After
            </span>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
              {AFTER_EXAMPLE}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BeforeAfter;
