/**
 * Safepay Payment Service
 * Public Key:  sec_b1b969e6-e74d-4569-8dcc-30d8770863cf
 * Secret Key:  0dfb36082b8c09cb78a592ac57aa248415f80d954be0551b8c2595eae3cd7ff2
 *
 * HOW IT WORKS (Frontend Checkout):
 * 1. We call Safepay API to create a payment tracker token
 * 2. We redirect user to Safepay hosted checkout page
 * 3. User pays via JazzCash / EasyPaisa / Card on Safepay's page
 * 4. Safepay redirects back to our success/cancel URL
 * 5. We verify the payment and confirm the order
 *
 * LOCALHOST → HOSTED:
 * When you go live, change SITE_URL below to your actual domain.
 */

const SAFEPAY_PUBLIC_KEY = 'sec_b1b969e6-e74d-4569-8dcc-30d8770863cf';
const SAFEPAY_SECRET_KEY = '0dfb36082b8c09cb78a592ac57aa248415f80d954be0551b8c2595eae3cd7ff2';
const SAFEPAY_BASE_URL = 'https://api.getsafepay.com'; // Live URL

// ⚠️ CHANGE THIS when you go to hosted website:
// e.g. 'https://zamanmall.com'
const SITE_URL = window.location.origin; // Auto-detects localhost OR live domain

export interface SafepayOrderData {
  amount: number;       // in PKR (e.g. 1500)
  orderId: string;      // your internal order ID
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

/**
 * Step 1: Create a payment tracker on Safepay
 * Returns a token used to build the checkout URL
 */
export const createSafepayTracker = async (orderData: SafepayOrderData): Promise<string> => {
  const amountInPaisa = Math.round(orderData.amount * 100); // Safepay uses paisa

  const response = await fetch(`${SAFEPAY_BASE_URL}/order/v1/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SAFEPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      merchant_api_key: SAFEPAY_PUBLIC_KEY,
      intent: 'CYBERSOURCE',
      mode: 'payment',
      currency: 'PKR',
      amount: amountInPaisa,
      order_id: orderData.orderId,
      customer: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone_number: orderData.customerPhone,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Safepay tracker creation failed: ${err}`);
  }

  const data = await response.json();
  // Safepay returns { data: { token: "..." } }
  const token = data?.data?.token || data?.token;
  if (!token) throw new Error('No token received from Safepay');
  return token;
};

/**
 * Step 2: Build the Safepay hosted checkout URL
 * Redirect user to this URL to complete payment
 */
export const buildSafepayCheckoutUrl = (token: string, orderId: string): string => {
  const successUrl = encodeURIComponent(`${SITE_URL}/payment/success?order_id=${orderId}`);
  const cancelUrl  = encodeURIComponent(`${SITE_URL}/payment/cancel?order_id=${orderId}`);

  return (
    `https://checkout.getsafepay.com/` +
    `?env=production` +
    `&token=${token}` +
    `&source=custom` +
    `&redirect_url=${successUrl}` +
    `&cancel_url=${cancelUrl}`
  );
};

/**
 * Main function: Create tracker + redirect to Safepay checkout
 */
export const initiateSafepayPayment = async (orderData: SafepayOrderData): Promise<void> => {
  const token = await createSafepayTracker(orderData);
  const checkoutUrl = buildSafepayCheckoutUrl(token, orderData.orderId);
  // Redirect to Safepay hosted page
  window.location.href = checkoutUrl;
};

/**
 * Verify payment after redirect back from Safepay
 * Call this on the /payment/success page
 */
export const verifySafepayPayment = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SAFEPAY_BASE_URL}/order/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SAFEPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        merchant_api_key: SAFEPAY_PUBLIC_KEY,
        token,
      }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    // Payment is successful if state is PAID
    return data?.data?.state === 'PAID' || data?.state === 'PAID';
  } catch {
    return false;
  }
};
