import { Lighthouse } from "../../../types";
import { useState, useEffect } from "react";
import { useApi } from "../../../hooks/useApi";
import { addVisitedLighthouse, removeVisitedLighthouse, getVisitedLighthouses } from "../../../utils/api";

const LighthouseCard = ({ lighthouse }: { lighthouse: Lighthouse }) => {
    const [isVisited, setIsVisited] = useState(false);
    const { data: visitedLighthouses, request: fetchVisited } = useApi<Lighthouse[]>(getVisitedLighthouses);
    const { isLoading: isAdding, request: addVisited } = useApi(addVisitedLighthouse);
    const { isLoading: isRemoving, request: removeVisited } = useApi(removeVisitedLighthouse);

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