import {
  ExclamationTriangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface PageStateProps {
  title: string;
  message?: string;
  tone?: 'default' | 'error';
}

const PageState = ({
  title,
  message,
  tone = 'default',
}: PageStateProps) => {
  const Icon = tone === 'error' ? ExclamationTriangleIcon : MapPinIcon;

  return (
    <div className="app-page flex items-center justify-center">
      <div className="app-card w-full max-w-lg p-8 text-center">
        <div
          className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl ${
            tone === 'error'
              ? 'bg-red-50 text-faros-coral'
              : 'bg-faros-mint text-faros-teal'
          }`}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="app-heading">{title}</h2>
        {message ? <p className="app-copy mt-3">{message}</p> : null}
      </div>
    </div>
  );
};

export default PageState;
