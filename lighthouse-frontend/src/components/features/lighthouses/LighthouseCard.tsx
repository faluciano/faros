import { Lighthouse } from "../../../types";
import { useState, useEffect } from "react";
import { useApi } from "../../../hooks/useApi";
import { useMutation } from "../../../hooks/useMutation";
import { addVisitedLighthouse, removeVisitedLighthouse, getVisitedLighthouses } from "../../../utils/api";

const LighthouseCard = ({ lighthouse }: { lighthouse: Lighthouse }) => {
    const [isVisited, setIsVisited] = useState(false);
    const { data: visitedLighthouses, request: fetchVisited } = useApi<Lighthouse[]>(getVisitedLighthouses);
    const { isLoading: isAdding, mutate: addVisited } = useMutation(addVisitedLighthouse);
    const { isLoading: isRemoving, mutate: removeVisited } = useMutation(removeVisitedLighthouse);

    useEffect(() => {
        fetchVisited();
    }, [fetchVisited]);

    useEffect(() => {
        if (visitedLighthouses) {
            setIsVisited(visitedLighthouses.some((l: Lighthouse) => l.id === lighthouse.id));
        }
    }, [visitedLighthouses, lighthouse.id]);

    const handleToggleVisit = async () => {
        if (isVisited) {
            await removeVisited(lighthouse.id);
        } else {
            await addVisited(lighthouse.id);
        }
        fetchVisited();
    };

    return (
        <article className="app-card-interactive overflow-hidden">
            <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${lighthouse.image})` }}
            />
            <div className="p-5">
                <h2 className="font-display text-2xl font-semibold text-faros-navy">{lighthouse.name}</h2>
                <p className="mt-1 text-faros-muted">{lighthouse.state}, {lighthouse.country}</p>
                
                <div className="mt-3 grid grid-cols-2 gap-x-4 text-sm text-faros-muted">
                    {lighthouse.height > 0 && <p><span className="font-semibold text-faros-ink">Height:</span> {lighthouse.height}m</p>}
                    {lighthouse.year_built > 0 && <p><span className="font-semibold text-faros-ink">Built:</span> {lighthouse.year_built}</p>}
                </div>
                {lighthouse.light_characteristics && (
                    <p className="mt-1 text-sm text-faros-muted">
                        <span className="font-semibold text-faros-ink">Light:</span> {lighthouse.light_characteristics}
                    </p>
                )}
                {lighthouse.description && (
                    <p className="mt-2 line-clamp-2 text-sm italic text-faros-ink">
                        "{lighthouse.description}"
                    </p>
                )}
                
                <div className="mt-3 border-t border-faros-line pt-3 text-xs text-faros-muted/80">
                    <p>Source: {lighthouse.source}</p>
                    {lighthouse.image_author && (
                        <p>
                            Image: {lighthouse.image_author} 
                            {lighthouse.image_license ? ` (${lighthouse.image_license})` : ''}
                            {lighthouse.image_url && (
                                <a href={lighthouse.image_url} target="_blank" rel="noopener noreferrer" className="ml-1 font-semibold text-faros-teal underline">
                                    [Link]
                                </a>
                            )}
                        </p>
                    )}
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleToggleVisit}
                        disabled={isAdding || isRemoving}
                        className={`app-button w-full ${
                            isVisited
                                ? 'bg-faros-coral text-white hover:bg-red-700 focus:ring-faros-coral'
                                : 'bg-faros-teal text-white hover:bg-faros-teal-dark focus:ring-faros-teal'
                        } ${(isAdding || isRemoving) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {(isAdding || isRemoving)
                            ? "Loading..."
                            : isVisited
                                ? "Remove from Visited"
                                : "Mark as Visited"
                        }
                    </button>
                </div>
            </div>
        </article>
    );
}

export default LighthouseCard;