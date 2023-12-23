/* ------------------- OTP --------------------- */
export const generateOtp = () => {
  const otp = Math.floor(10000 + Math.random() * 900000); // generating six digit otp
  let expiry = new Date();
  expiry.setTime(new Date().getTime() + 30 * 60 * 1000); // adding 30 minutes extra

  return { otp, expiry };
};

/* ------------------- Notification --------------------- */
export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
  try {
    const accountSid = "";
    const authToken = "";
    const client = require("twilio")(accountSid, authToken);

    const response = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: "",
      to: `+977${toPhoneNumber}`, // recipient phone number // Add country before the number
    });
    return response;
  } catch (error) {
    return false;
  }
};
