import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Home", to: "/" },
      { label: "Help Center", to: "/help" },
      { label: "Pricing", to: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Contact us", to: "/contact" },
      { label: "Feedback", to: "/feedback" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & FAQ", to: "/help" },
      { label: "Open support chat", event: true },
    ],
  },
];

function Footer() {
  const openChat = () => window.dispatchEvent(new CustomEvent("promptstudio:open-support"));

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-1 py-1" aria-label="PromptStudio AI home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white font-black">⌂</span>
              <span className="text-lg font-black text-slate-900">PromptStudio <span className="text-indigo-600">AI</span></span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Turn rough ideas and reference images into clearer AI prompts.</p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black text-slate-900">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.event ? (
                      <button type="button" onClick={openChat} className="text-sm text-slate-500 hover:text-slate-900">{link.label}</button>
                    ) : (
                      <Link to={link.to} className="text-sm text-slate-500 hover:text-slate-900">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PromptStudio AI. All rights reserved.</p>
          <Link to="/" className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-900">⌂ Back to Home</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
