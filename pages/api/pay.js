import axios from 'axios';

// pages/api/pay.js (for /pages directory)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { paymentToken, amount, isAccountToken, customerReferenceNumber, paymentReferenceNumber } = req.body;

  if (!paymentToken) {
    return res.status(400).json({ message: 'Payment token missing' });
  }

  try {
    const paymentResponse = await axios.post(
      'https://api.quickstream.support.qvalent.com/rest/v1/transactions',
      {
        // Use the token as either a single use token or account token

         ...(isAccountToken
      ? { accountToken: paymentToken }
      : { singleUseTokenId: paymentToken }),
  
        transactionType: 'PAYMENT',
        supplierBusinessCode: 'C01855',
        principalAmount: amount,
        ...(customerReferenceNumber
          ? { customerReferenceNumber }
          : {}),
        ...(paymentReferenceNumber
          ? { paymentReferenceNumber }
          : {}),
        eci: 'MAIL',
        currency: 'AUD',
        ipAddress: '58.178.80.237',
        storedCredentialData: { entryMode: 'MANUAL' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic QzAxODU1X1NFQ185aXU5aXRucm02dnY3YXo4anV2YXJ4cThnaDNhcmo5bWt0anVpczJ4bmp4eXhmY242amF0N3ZkbTdjdDg6',
        },
      }
    );

    // You can adjust the response as needed
    return res.status(200).json({
      output: 'success',
      message: `✅ payment verified!`,
      data: paymentResponse.data,
    });
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return res.status(500).json({
      output: 'fail',
      message: 'Transaction failed',
      error: error.response?.data || error.message,
    });
  }
}
