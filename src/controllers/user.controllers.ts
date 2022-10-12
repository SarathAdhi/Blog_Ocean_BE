import jwt_decode from "jwt-decode";
import UserModel from "../models/user.model";
import { User } from "../types/user";

export type JWT_Decode = {
  email: string;
  name: string;
  picture: string;
};

export const decodeToken = (token: string) => {
  const decoded: JWT_Decode = jwt_decode(token!);

  const user = {
    email: decoded.email,
    name: decoded.name,
    image: decoded.picture,
  };

  return user;
};

export const _createUser = async (body: any) => {
  return await UserModel.create({ ...body });
};

export const _getUsers = async () => {
  return await UserModel.find();
};

export const _userFilter = async (filter: any) => {
  return await UserModel.find(filter);
};

export const _getUserById = async (id: string) => {
  return await UserModel.findById(id).populate("followers");
};

export const _getUserByEmail = async (email: string) => {
  return (await UserModel.findOne({ email }).populate("followers")) as User;
};

export const _getUserByUsername = async (username: string) => {
  return await UserModel.findOne({ username }).populate("followers");
};

export const _updateUserProfile = async (_id: string, update: any) => {
  const filter = { _id };
  return (await UserModel.findOneAndUpdate(filter, update).populate(
    "followers"
  )) as User;
};
