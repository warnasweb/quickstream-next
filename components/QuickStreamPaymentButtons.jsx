import React from 'react';

const QuickStreamPaymentButtons = ({
  handleGetSingleToken,
  handlePayAdhoc,
  handleCreateAccountToken,
  handlePayByAccountToken,
}) => (
  <div className="flex gap-4 mt-4">
    <button
      type="button"
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold shadow"
      onClick={handleGetSingleToken}
    >
      Get Single Token
    </button>
    <button
      type="button"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow"
      onClick={handlePayAdhoc}
    >
      Pay Adhoc
    </button>
    <button
      type="button"
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow"
      onClick={handleCreateAccountToken}
    >
      Create Account Token
    </button>
    <button
      type="button"
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold shadow"
      onClick={handlePayByAccountToken}
    >
      Pay by Account Token
    </button>
  </div>
);

export default QuickStreamPaymentButtons;