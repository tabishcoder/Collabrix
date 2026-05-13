require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User"); // adjust path if needed

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas connected");

    const result = await User.updateOne(
      { email: "tabishakhtar007860@gmail.com" },
      {
        $set: {
          role: "admin",
          isActive: true,
        },
      }
    );

    console.log("Update Result:", result);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();