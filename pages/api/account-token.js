import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { singleUseTokenId } = req.body;

  if (!singleUseTokenId) {
    return res.status(400).json({ message: 'singleUseTokenId is required' });
  }

  try {
    const response = await axios.post(
      'https://api.quickstream.support.qvalent.com/rest/v1/accounts',
      { singleUseTokenId },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic QzAxODU1X1NFQ185aXU5aXRucm02dnY3YXo4anV2YXJ4cThnaDNhcmo5bWt0anVpczJ4bmp4eXhmY242amF0N3ZkbTdjdDg6'
        }
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Account token error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to create account token',
      error: error.response?.data || error.message,
    });
  }
}