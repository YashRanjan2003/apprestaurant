import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { submitOrderFeedback, submitItemFeedback, getOrderFeedback, getItemsFeedback } from '@/lib/supabase/feedback';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
}

interface FeedbackFormProps {
  orderId: string;
  items: OrderItem[];
}

export default function FeedbackForm({ orderId, items }: FeedbackFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [orderRating, setOrderRating] = useState(0);
  const [orderComment, setOrderComment] = useState('');
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);

  // Fetch existing feedback on component mount
  useEffect(() => {
    async function fetchFeedback() {
      try {
        // Fetch order feedback
        const orderFeedback = await getOrderFeedback(orderId);
        if (orderFeedback) {
          setOrderRating(orderFeedback.rating || 0);
          setOrderComment(orderFeedback.comment || '');
          setHasSubmittedFeedback(true);
        }

        // Fetch item feedback
        const itemsFeedback = await getItemsFeedback(orderId);
        if (itemsFeedback && itemsFeedback.length > 0) {
          const ratings: Record<string, number> = {};
          const comments: Record<string, string> = {};
          
          itemsFeedback.forEach(feedback => {
            ratings[feedback.order_item_id] = feedback.rating;
            comments[feedback.order_item_id] = feedback.comment || '';
          });
          
          setItemRatings(ratings);
          setItemComments(comments);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setIsLoadingFeedback(false);
      }
    }

    fetchFeedback();
  }, [orderId]);

  const handleItemRatingChange = (itemId: string, rating: number) => {
    setItemRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleItemCommentChange = (itemId: string, comment: string) => {
    setItemComments(prev => ({ ...prev, [itemId]: comment }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderRating === 0) {
      toast.error('Please rate your overall experience');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Submit order feedback
      await submitOrderFeedback({
        orderId,
        rating: orderRating,
        comment: orderComment
      });
      
      // Submit feedback for each item that has a rating
      for (const itemId of Object.keys(itemRatings)) {
        if (itemRatings[itemId] > 0) {
          const item = items.find(i => i.id === itemId);
          if (item) {
            await submitItemFeedback({
              orderItemId: itemId,
              menuItemId: item.menu_item_id,
              orderId,
              rating: itemRatings[itemId],
              comment: itemComments[itemId]
            });
          }
        }
      }
      
      toast.success('Thank you for your feedback!');
      setHasSubmittedFeedback(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingFeedback) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Order Feedback</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="font-semibold mb-4">Order Feedback</h2>
      
      {hasSubmittedFeedback ? (
        <div className="space-y-4">
          <div className="text-center py-2">
            <p className="text-green-600 font-medium">Thank you for your feedback!</p>
            <StarRating rating={orderRating} onRatingChange={() => {}} disabled />
            {orderComment && (
              <p className="mt-2 text-gray-600 italic">"{orderComment}"</p>
            )}
          </div>
          
          {Object.keys(itemRatings).length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="font-medium text-sm text-gray-600">Your item ratings:</h3>
              {items.map(item => {
                const rating = itemRatings[item.id] || 0;
                if (rating > 0) {
                  return (
                    <div key={item.id} className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <StarRating rating={rating} onRatingChange={() => {}} size="sm" disabled />
                      {itemComments[item.id] && (
                        <p className="text-xs text-gray-500 italic">"{itemComments[item.id]}"</p>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
          
          <button
            onClick={() => setHasSubmittedFeedback(false)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-4"
          >
            Edit my feedback
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was your overall experience?
            </label>
            <div className="flex flex-col space-y-2">
              <StarRating rating={orderRating} onRatingChange={setOrderRating} />
              <textarea
                value={orderComment}
                onChange={(e) => setOrderComment(e.target.value)}
                placeholder="Share your thoughts about your order (optional)"
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
            </div>
          </div>
          
          <div className="space-y-4 mt-4">
            <h3 className="font-medium text-sm">Rate individual items:</h3>
            {items.map(item => (
              <div key={item.id} className="border-t pt-3">
                <p className="text-sm font-medium">{item.name} (x{item.quantity})</p>
                <div className="mt-1">
                  <StarRating
                    rating={itemRatings[item.id] || 0}
                    onRatingChange={(rating) => handleItemRatingChange(item.id, rating)}
                    size="sm"
                  />
                </div>
                {itemRatings[item.id] > 0 && (
                  <textarea
                    value={itemComments[item.id] || ''}
                    onChange={(e) => handleItemCommentChange(item.id, e.target.value)}
                    placeholder="Comments about this item (optional)"
                    className="w-full px-3 py-2 border rounded-md text-sm mt-2"
                    rows={1}
                  />
                )}
              </div>
            ))}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || orderRating === 0}
            className="w-full bg-black text-white py-2 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
} 