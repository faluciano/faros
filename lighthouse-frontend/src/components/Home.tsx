const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Welcome to Faros
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your lighthouse management platform
          </p>
          <div className="bg-white shadow-lg rounded-lg p-8">
            <p className="text-lg text-gray-700">
              Explore our interactive map and discover lighthouses around the world.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 