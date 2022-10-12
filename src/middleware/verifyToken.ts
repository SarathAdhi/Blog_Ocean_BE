import jwt_decode from "jwt-decode";
import UserModel from "../models/user.model";

export type JWT_Decode = {
  email: string;
  name: string;
  picture: string;
};

export const validateToken = async (token: string) => {
  try {
    let decoded: JWT_Decode = jwt_decode(token!);

    let user = await UserModel.findOne({ email: decoded.email }).populate(
      "followers"
    );

    user?.populate("following");

    return { user, isAuth: true };
  } catch (err) {
    return { user: {}, isAuth: false };
  }
};
