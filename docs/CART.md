## Add To Cart

```ts
export const AddToCart = async (req: Request, res: Response) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    let cartItems = Array();
    const { _id, unit } = <OrderInputs>req.body;

    const food = await Food.findById(_id);
    if (food) {
      if (profile != null) {
        cartItems = profile.cart;

        if (cartItems.length > 0) {
          // check and update
          let existFoodItems = cartItems.filter(
            (item) => item.food._id.toString() === _id
          );
          if (existFoodItems.length > 0) {
            const index = cartItems.indexOf(existFoodItems[0]);

            if (unit > 0) {
              cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else {
            cartItems.push({ food, unit });
          }
        } else {
          cartItems.push({ food, unit });
        }

        if (cartItems) {
          profile.cart = cartItems as any;
          const cartResult = await profile.save();
          return res.status(200).json(cartResult.cart);
        }
      }
    }
  }

  return res.status(404).json({ msg: "Unable to add to cart!" });
};
```
