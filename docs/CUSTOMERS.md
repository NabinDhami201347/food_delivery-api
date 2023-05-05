## Validation

```ts
import { IsEmail, Length } from "class-validator";

export class CreateCustomerInput {
  @IsEmail()
  email: string;

  @Length(7, 12)
  phone: string;

  @Length(6, 12)
  password: string;
}

export interface CustomerPayload {
  _id: string;
  email: string;
  verified: boolean;
}
```

## Customer Controller

```ts
export const CustomerSignUp = async (req: Request, res: Response) => {
  const customerInputs = plainToInstance(CreateCustomerInput, req.body);
  const validationError = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (validationError.length > 0) {
    return res.status(400).json(validationError);
  }

  const { email, phone, password } = customerInputs;
  const salt = await generateSalt();
  const hashed = await hashedPassword(password, salt);

  const { otp, expiry } = generateOtp();
  const existingCustomer = await Customer.find({ email });
  if (existingCustomer.length > 0) {
    return res.status(400).json({ message: "Email already exist!" });
  }

  const result = await Customer.create({...});
  if (result) {
    await onRequestOTP(otp, phone);
    const signature = await generateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified,
    });
    return res
      .status(201)
      .json({ signature, verified: result.verified, email: result.email });
  }
  return res.status(400).json({ msg: "Error while creating user" });
};
```

```ts
export const CustomerVerify = async (req: Request, res: Response) => {
  const { otp } = req.body;
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;

        const updatedCustomerResponse = await profile.save();
        const signature = await generateSignature({
          _id: updatedCustomerResponse._id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });

        return res.status(200).json({
          signature,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
      }
    }
  }

  return res.status(400).json({ msg: "Unable to verify Customer" });
};
```

## Notification

```ts
export const generateOtp = () => {
  const otp = Math.floor(10000 + Math.random() * 900000); // generating six digit otp
  let expiry = new Date();
  expiry.setTime(new Date().getTime() + 30 * 60 * 1000); // adding 30 minutes extra

  return { otp, expiry };
};
```

```ts
export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
  const accountSid = "...";
  const authToken = "...";
  const client = require("twilio")(accountSid, authToken);

  const response = await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: "+12342745",
    to: `+977${toPhoneNumber}`, // recipient phone number // Add country before the number
  });

  return response;
};
```
