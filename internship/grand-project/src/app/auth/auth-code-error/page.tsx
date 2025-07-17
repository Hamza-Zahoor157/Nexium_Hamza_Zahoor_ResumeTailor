import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 mb-6">
          The login link is invalid, expired, or has already been used. Please try logging in again.
        </p>
        <Link href="/login">
          <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">
            Return to Login
          </span>
        </Link>
      </div>
    </div>
  );
}
