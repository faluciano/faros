import { Lighthouse } from "../../../types";

interface LighthouseListProps {
  lighthouses: Lighthouse[];
  onRemove: (id: string) => void;
  title: string;
  emptyMessage: string;
}

const LighthouseList = ({ lighthouses, onRemove, title, emptyMessage }: LighthouseListProps) => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {title} ({lighthouses?.length || 0})
        </h1>
        
        {lighthouses && lighthouses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lighthouses.map((lighthouse) => (
              <div
                key={lighthouse.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={lighthouse.image}
                  alt={lighthouse.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {lighthouse.name}
                  </h3>
                  <div className="text-gray-600">
                    <p>{lighthouse.state}</p>
                    <p>{lighthouse.country}</p>
                  </div>
                  <button
                    onClick={() => onRemove(lighthouse.id)}
                    className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LighthouseList;