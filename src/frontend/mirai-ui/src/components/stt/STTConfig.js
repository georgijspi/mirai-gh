import React from "react";

const STTConfig = ({
  leopardModelPublicPath,
  setLeopardModelPublicPath,
  accessKey,
  setAccessKey,
}) => {
  return (
    <div>
      <h4 className="text-xl font-bold mb-4 text-white">
        Speech-to-Text Configuration
      </h4>
      <label className="block text-gray-300 mb-2">
        Leopard Model Public Path
      </label>
      <input
        type="text"
        value={leopardModelPublicPath}
        onChange={(e) => setLeopardModelPublicPath(e.target.value)}
        className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-4">
        <h4 className="text-xl font-bold mb-4 text-white">Access Key</h4>
        <input
          type="text"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your Picovoice access key here"
        />
        <p className="text-gray-400 text-sm mt-1">
          Required for Leopard speech recognition. Get your key at{" "}
          <a
            href="https://console.picovoice.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            console.picovoice.ai
          </a>
        </p>
      </div>
    </div>
  );
};

export default STTConfig;
