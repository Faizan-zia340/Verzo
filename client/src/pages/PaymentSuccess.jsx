import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  useEffect(() => {
    toast.success('Payment successful — your credits are ready!');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <FiCheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6">Your credits have been added to your account. Start generating content now.</p>
        <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition inline-block">Go to Dashboard</Link>
      </div>
    </div>
  );
}
