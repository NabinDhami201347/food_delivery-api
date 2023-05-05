## Create Order

```ts
export const CreateOrder = async (req: Request, res: Response) => {
  const customer = req.user; // get current user
  if (customer) {
    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`; // create an order id
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const cart = <[OrderInputs]>req.body; // get order items from request [{id, unit}]

      let cartItems = Array();
      let netAmount = 0.0;
      const foods = await Food.find()
        .where("_id")
        .in(cart.map((item) => item._id))
        .exec();

      foods.map((food) => {
        cart.map(({ _id, unit }) => {
          if (food._id == _id) {
            netAmount += food.price * unit; // calculate order amount
            cartItems.push({ food, unit });
          }
        });
      });

      if (cartItems) {
        const currentOrder = await Order.create({
          orderId: orderId, // create order with item description
          items: cartItems,
          totalAmount: netAmount,
          orderDate: new Date(),
          paidThrough: "COD",
          paymentReponse: "",
          orderStatus: "Waiting",
        });

        if (currentOrder) {
          profile.orders.push(currentOrder); // finally update orders to user account
        }
        await profile.save();
        return res.status(200).json(currentOrder);
      }
    }
  }

  return res.status(400).json({ msg: "Error while Creating Order" });
};
```
