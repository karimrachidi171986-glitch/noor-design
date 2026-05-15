import React, { useEffect, useRef } from 'react';

interface PayPalButtonProps {
  amount: string;
  currency?: string;
  itemName: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ 
  amount, 
  currency = 'EUR', 
  itemName, 
  onSuccess, 
  onError, 
  onCancel 
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.paypal && paypalRef.current) {
      // Clear previous buttons if any
      paypalRef.current.innerHTML = '';
      
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
          tagline: false
        },
        createOrder: async () => {
          try {
            console.log('Initiating PayPal order for:', amount, currency, itemName);
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount,
                currency_code: currency,
                itemName,
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to create order');
            }
            
            const order = await response.json();
            return order.id;
          } catch (err) {
            console.error('Error creating PayPal order:', err);
            onError(err);
            throw err;
          }
        },
        onApprove: async (data: any) => {
          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderID: data.orderID,
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to capture order');
            }
            
            const details = await response.json();
            
            if (details.status === 'COMPLETED') {
              onSuccess(details);
            } else {
              onError(details);
            }
          } catch (err) {
            console.error('Error capturing PayPal order:', err);
            onError(err);
          }
        },
        onError: (err: any) => {
          console.error('PayPal Button Error:', err);
          onError(err);
        },
        onCancel: () => {
          if (onCancel) onCancel();
        }
      }).render(paypalRef.current);
    }
  }, [amount, currency, itemName, onSuccess, onError, onCancel]);

  return <div ref={paypalRef} className="w-full"></div>;
};

export default PayPalButton;
