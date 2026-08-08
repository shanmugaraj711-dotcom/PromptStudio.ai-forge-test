import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Get Better Results from Any AI.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              Describe what you need. PromptStudio creates professional prompts optimized for
              ChatGPT, Claude, Gemini and more.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Start Free
                </Button>
              </Link>

              <a href="#prompt-builder">
                <Button variant="secondary" size="lg">
                  See Demo
                </Button>
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-blue-100 blur-3xl opacity-70" />
            <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-blue-200 blur-3xl opacity-60" />

            <div className="relative flex h-80 w-80 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-gray-100 shadow-xl sm:h-96 sm:w-96">
              <div className="absolute h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 opacity-20 blur-2xl" />

              <div className="relative flex h-44 w-44 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-2xl rotate-6">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm -rotate-6">
                  <svg
                    className="h-16 w-16 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
              </div>

              <div className="absolute -top-6 -right-4 h-16 w-16 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center rotate-12">
                <div className="h-3 w-3 rounded-full bg-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
