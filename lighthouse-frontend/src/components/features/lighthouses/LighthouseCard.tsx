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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${lighthouse.image})` }}
            />
            <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900">{lighthouse.name}</h2>
                <p className="text-gray-600">{lighthouse.state}, {lighthouse.country}</p>
                
                <div className="mt-2 text-sm text-gray-500 grid grid-cols-2 gap-x-4">
                    {lighthouse.height > 0 && <p><span className="font-medium">Height:</span> {lighthouse.height}m</p>}
                    {lighthouse.year_built > 0 && <p><span className="font-medium">Built:</span> {lighthouse.year_built}</p>}
                </div>
                {lighthouse.light_characteristics && (
                    <p className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Light:</span> {lighthouse.light_characteristics}
                    </p>
                )}
                {lighthouse.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2 italic">
                        "{lighthouse.description}"
                    </p>
                )}

                <div className="mt-4">
                    <button
                        onClick={handleToggleVisit}
                        disabled={isAdding || isRemoving}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                            isVisited
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
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
        </div>
    );
}

export default LighthouseCard;