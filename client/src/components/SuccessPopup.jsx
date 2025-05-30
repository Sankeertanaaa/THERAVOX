import React from 'react';

const SuccessPopup = ({ message }) => {
  return (
    <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50">
      {message}
    </div>
  );
};

export default SuccessPopup;
