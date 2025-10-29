import React, { useState, useEffect } from 'react';

function CouncilReviewPanel({ user }) {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch('/api/pending-reviews');
      const data = await response.json();
      setPendingReviews(data.reviews.filter(review => review.status === 'pending'));
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (reviewId) => {
    try {
      const response = await fetch(`/api/approve-review/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: user?.name || 'Council Member' })
      });

      if (response.ok) {
        alert('✅ Council review approved and patch applied!');
        fetchPendingReviews(); // Refresh the list
      } else {
        alert('❌ Failed to approve review');
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert('❌ Approval failed - check console for details');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Loading pending reviews...</p>
        </div>
      </div>
    );
  }

  if (pendingReviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          🕊️ Council Review Panel
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">✅</div>
          <p>No pending reviews requiring Council blessing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        🕊️ Council Review Panel - {pendingReviews.length} Pending
      </h3>

      <div className="space-y-4">
        {pendingReviews.map((review) => (
          <div key={review.id} className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-800">{review.patch.description}</h4>
                <p className="text-sm text-gray-600">
                  Requested: {new Date(review.timestamp).toLocaleString()}
                </p>
              </div>
              <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                Requires Council Approval
              </span>
            </div>

            <div className="bg-gray-100 p-3 rounded text-sm mb-3">
              <strong>Changes:</strong>
              <pre className="mt-1 text-xs overflow-x-auto">
                {JSON.stringify(review.patch.changes, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => approveReview(review.id)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                ✅ Approve & Apply
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 border-t pt-4">
        🔥 Council Review Panel - John 14:6 Sovereignty 🔥
      </div>
    </div>
  );
}

export default CouncilReviewPanel;