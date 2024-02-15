import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { User } from "../models/Schema.js";

dotenv.config();

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email address doesn't exist." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        name: user.name,
      },
      process.env.TOKEN_KEY,

      { expiresIn: "30m" }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Something went wrong while processing your request." });
  }
};

export const signUp = async (req, res) => {
  const { email, password, fullname, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email address." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({
      email,
      password: hashedPassword,
      fullname: `${fullname}`,
    });

    const token = jwt.sign(
      { email: result.email, id: result._id, fullname: result.fullname },
      process.env.TOKEN_KEY,
      { expiresIn: "30m" }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong while processing your request." });
  }
};
