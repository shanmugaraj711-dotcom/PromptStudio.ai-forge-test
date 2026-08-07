import SectionHeading from '../../components/common/SectionHeading';
import { AI_MODELS } from '../../constants/aiModels';

function WorksWith() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Compatibility"
          title="Works with your favorite AI"
          subtitle="Optimized prompt output tailored for every major model."
        />

        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {AI_MODELS.map((model) => (
            <div
              key={model.id}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/90 text-white font-bold">
                {model.label.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-gray-900">{model.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WorksWith;
