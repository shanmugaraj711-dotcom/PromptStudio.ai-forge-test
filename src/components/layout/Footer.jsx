const footerLinks = {
  Product: ['Features', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers'],
  Legal: ['Privacy', 'Terms'],
};

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                P
              </span>
              <span className="text-lg font-bold text-gray-900">PromptStudio AI</span>
            </a>
            <p className="mt-4 text-sm text-gray-500">
              Helping everyone get better results from AI.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-gray-900">{section}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-gray-100 pt-8">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} PromptStudio AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
