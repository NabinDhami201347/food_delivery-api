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
    const accountSid = "AC44a9396adcf76c558b0e06c94d214979";
    const authToken = "83993d0cf9fdb14c092e06d291395a68";
    const client = require("twilio")(accountSid, authToken);

    const response = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: "+13204094724",
      to: `+977${toPhoneNumber}`, // recipient phone number // Add country before the number
    });
    return response;
  } catch (error) {
    return false;
  }
};
