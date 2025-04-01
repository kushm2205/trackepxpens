import axios from 'axios';
import {Alert} from 'react-native';

// Twilio Credentials (Replace with your actual credentials)
const TWILIO_ACCOUNT_SID = 'AC60504faabbdf5a03de823639863ccc1c';
const TWILIO_AUTH_TOKEN = '03e03810fb74c72da323de9274beb11a';
const TWILIO_PHONE_NUMBER = '+16615351695';
const TWILIO_VERIFY_SID = 'VA8b9082f3864a8ee7cfd3cc9b2e33a88d';

// Twilio Base URL
const TWILIO_URL = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;

// Function to send OTP
export const sendOtp = async (phoneNumber: string) => {
  try {
    const response = await axios.post(
      TWILIO_URL,
      new URLSearchParams({
        To: phoneNumber,
        Channel: 'sms', // Can be 'sms' or 'call'
      }).toString(),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    console.log('OTP Sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Twilio Error:', error.response?.data || error.message);
    Alert.alert(
      'Error',
      `Failed to send OTP: ${error.response?.data?.message || error.message}`,
    );
    throw error;
  }
};
