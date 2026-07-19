import { MapPinIcon } from "@heroicons/react/24/outline";
import { Lighthouse } from "../../../types";

interface LighthouseListProps {
  lighthouses: Lighthouse[];
  onRemove: (id: string) => void;
  title: string;
  emptyMessage: string;
}

const LighthouseList = ({
  lighthouses,
  onRemove,
  title,
  emptyMessage,
}: LighthouseListProps) => {
  return (
    <main className="app-page">
      <div className="app-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="app-eyebrow">Your collection</p>
            <h1 className="app-heading mt-2">{title}</h1>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-faros-mint px-4 py-2 text-sm font-bold text-faros-teal">
            <MapPinIcon className="h-4 w-4" aria-hidden="true" />
            {lighthouses.length} saved
          </div>
        </div>

        {lighthouses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lighthouses.map((lighthouse) => (
              <article key={lighthouse.id} className="app-card-interactive overflow-hidden">
                <img
                  src={lighthouse.image}
                  alt={lighthouse.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-5">
                  <h2 className="font-display text-2xl font-semibold text-faros-navy">
                    {lighthouse.name}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-faros-muted">
                    {[lighthouse.state, lighthouse.country].filter(Boolean).join(", ")}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemove(lighthouse.id)}
                    className="app-button-danger mt-5 w-full"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="app-card p-10 text-center">
            <div className="app-icon-tile mx-auto">
              <MapPinIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="app-copy mx-auto mt-5 max-w-xl">{emptyMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default LighthouseList;
