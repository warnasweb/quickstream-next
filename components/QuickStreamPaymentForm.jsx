// QuickStreamPaymentForm.jsx
'use client';
import React, { useRef, useState } from 'react';
import QuickStreamTrustedFrame from './QuickStreamTrustedFrame';
import axios from 'axios';
import QuickStreamPaymentButtons from './QuickStreamPaymentButtons';

const QuickStreamPaymentForm = () => {
  const trustedFrameRef = useRef(null);
  const [token, setToken] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [amount, setAmount] = useState('100.00'); // Default amount
  const [accountToken, setAccountToken] = useState('');

  const handleTrustedFrameReady = (frame) => {
    trustedFrameRef.current = frame;
    console.log('Trusted Frame is ready.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!trustedFrameRef.current) {
      alert('Frame not ready yet');
      return;
    }

    trustedFrameRef.current.submitForm((errors, data) => {
      if (errors) {
        console.error('Submit error:', errors);
        //alert('Form submission failed.');
        return;
      }

      const tokenId = data?.singleUseToken?.singleUseTokenId;
      if (tokenId) {
        setToken(tokenId);

        // Call the Next.js API route instead of a backend server
        axios.post('/api/pay', {
          paymentToken: tokenId,
          amount: parseFloat(amount)
        })
          .then(res => {
            setPaymentResult(res.data);
            if (res.data.output === 'success') {
              alert('Payment successful!');
            } else {
              alert('Payment failed: ' + (res.data.message || JSON.stringify(res.error)));
            }
          })
          .catch(err => {
            setPaymentResult(err.response?.data );
            console.error('Payment error:', err);
          });
      } else {
        alert('No token received.');
      }
    });
  };

  const handleGetSingleToken = (e) => {
    e.preventDefault();
    if (!trustedFrameRef.current) {
      alert('Frame not ready yet');
      return;
    }
    trustedFrameRef.current.submitForm((errors, data) => {
      if (errors) {
        console.error('Submit error:', errors);
        return;
      }
      const tokenId = data?.singleUseToken?.singleUseTokenId;
      if (tokenId) {
        setToken(tokenId);
        alert('Single Use Token generated!');
      } else {
        alert('No token received.');
      }
    });
  };

  const handlePayAdhoc = (e) => {
    e.preventDefault();
    if (!trustedFrameRef.current) {
      alert('Frame not ready yet');
      return;
    }
    trustedFrameRef.current.submitForm((errors, data) => {
      if (errors) {
        console.error('Submit error:', errors);
        return;
      }
      const tokenId = data?.singleUseToken?.singleUseTokenId;
      if (tokenId) {
        setToken(tokenId);
        axios.post('/api/pay', {
          paymentToken: tokenId,
          amount: parseFloat(amount)
        })
          .then(res => {
            setPaymentResult(res.data);
            if (res.data.output === 'success') {
              alert('Payment successful!');
            } else {
              alert('Payment failed: ' + (res.data.message || JSON.stringify(res.error)));
            }
          })
          .catch(err => {
            setPaymentResult(err.response?.data );
            console.error('Payment error:', err);
          });
      } else {
        alert('No token received.');
      }
    });
  };

  const handleCreateAccountToken = async (e) => {
  e.preventDefault();
  if (!token) {
    alert('No single use token available. Please generate one first.');
    return;
  }
  try {
    const response = await axios.post('/api/account-token', {
      singleUseTokenId: token,
    });
    setPaymentResult(response.data);
    // Store the account token in its own state
    const accToken = response.data.accountToken || response.data.accountTokenId;
    if (accToken) {
      setAccountToken(accToken);
      alert('Account token created!');
    } else {
      alert('Account token not found in response.');
    }
  } catch (error) {
    setPaymentResult(error.response?.data || { error: error.message });
    alert('Failed to create account token: ' + (error.response?.data?.message || error.message));
    console.error(error);
  }
};

const handlePayByAccountToken = async (e) => {
    e.preventDefault();
    // You may want to store the account token in state after creating it
    //const accountToken = paymentResult?.accountToken || paymentResult?.accountTokenId;
    if (!accountToken) {
      alert('No account token available. Please create one first.');
      return;
    }
    try {
      const response = await axios.post('/api/pay', {
        paymentToken: accountToken,
        amount: parseFloat(amount),
        isAccountToken: true, // Optional: let your backend know this is an account token
      });
      setPaymentResult(response.data);
      alert('Payment by account token processed!');
    } catch (error) {
      setPaymentResult(error.response?.data || { error: error.message });
      alert('Failed to pay by account token: ' + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
  QuickStream Payment
</h2>
      <div>card number: 4242424242424242</div>
      <QuickStreamTrustedFrame onReady={handleTrustedFrameReady} />
      <p style={{ color: 'red', fontSize: '0.9rem' }}>
        Please fill in your card details in the form above.
      </p>
      <div style={{ marginTop: '1rem' }}>
        <label htmlFor="stoken">Single Use Token:</label>
        <span id="stoken" style={{ marginLeft: '0.5rem', color: 'blue' }}>
          {token || 'Not generated yet'}
        </span>
      </div>
      {accountToken && (
        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="accountToken">Account Token:</label>
          <span id="accountToken" style={{ marginLeft: '0.5rem', color: 'green' }}>
            {accountToken}
          </span>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="amount" className="block font-semibold mb-1">Amount (AUD):</label>
        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          required
        />
      </div>
      <br />
      <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold shadow" style={{ marginTop: '1rem' }}>
        Submit Payment
      </button>

       <QuickStreamPaymentButtons
      handleGetSingleToken={handleGetSingleToken}
      handlePayAdhoc={handlePayAdhoc}
      handleCreateAccountToken={handleCreateAccountToken}
      handlePayByAccountToken={handlePayByAccountToken}
    />
      {paymentResult && (
        <pre
          style={{
            background: "#1a1a1a",
            color: "#d4d4d4",
            padding: "1rem",
            borderRadius: "6px",
            marginTop: "1rem",
            fontSize: "0.95rem",
            overflowX: "auto"
          }}
        >
          <code>
            {JSON.stringify(paymentResult, null, 2)}
          </code>
        </pre>
      )}
    </form>
  );
};

export default QuickStreamPaymentForm;