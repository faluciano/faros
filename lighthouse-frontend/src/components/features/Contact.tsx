import { CodeBracketIcon } from '@heroicons/react/24/outline';

const Contact = () => {
  return (
    <main className="app-page flex items-center">
      <div className="app-shell max-w-3xl">
        <section className="app-card p-8 text-center sm:p-12">
          <div className="app-icon-tile mx-auto">
            <CodeBracketIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="app-eyebrow mt-6">Open source</p>
          <h1 className="app-title mt-3">Built in the open.</h1>
          <p className="app-copy mx-auto mt-5 max-w-xl text-lg">
            Explore the Faros codebase, follow development, or share an idea on
            GitHub.
          </p>
          <a
            href="https://github.com/faluciano/faros"
            target="_blank"
            rel="noreferrer"
            className="app-button-primary mt-8"
          >
            <CodeBracketIcon className="h-5 w-5" aria-hidden="true" />
            View the repository
          </a>
        </section>
      </div>
    </main>
  );
};

export default Contact;
