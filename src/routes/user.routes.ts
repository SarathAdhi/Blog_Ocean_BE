import express, { Request, Response } from "express";
import {
  decodeToken,
  _createUser,
  _getUserByEmail,
  _getUserById,
  _getUserByUsername,
  _getUsers,
  _updateUserProfile,
  _userFilter,
} from "../controllers/user.controllers";
import { validateToken } from "../middleware/verifyToken";
import { User } from "../_types/user";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { id, username: name } = req.query;

  if (id) {
    const user = await _getUserById(id as string);
    return res.status(200).json(user);
  } else if (name) {
    const user = await _getUserByUsername(name as string);
    return res.status(200).json(user);
  }

  const users = await _getUsers();
  return res.status(200).json(users);
});

router.put("/", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);
  const userDetails = user as User;

  const { username } = req.body;
  const isUsernameExist = await _getUserByUsername(username);

  const email = isUsernameExist?.email;
  const isUserProfile = email === userDetails.email;

  if (!isUsernameExist || isUserProfile) {
    const userData: User = await _getUserByEmail(userDetails.email as string);

    await _updateUserProfile(userData._id as string, req.body);

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", error: "" });
  }

  return res.status(409).json({ error: "Username already exists." });
});

router.post("/create", async (req: Request, res: Response) => {
  const { token } = req.body;

  const userDetails = decodeToken(token as string);

  const user = await _getUserByEmail(userDetails.email as string);

  if (user) {
    return res.status(200).json({ message: "Login successfully.", user });
  }

  const newUser = await _createUser(userDetails);

  return res
    .status(200)
    .json({ message: "Account created successfully.", user: newUser });
});

router.get("/profile", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);

  if (!isAuth) return res.status(401).json({ error: "Invalid token." });

  const userInfo = user as User;

  if (userInfo?._id) {
    return res.status(200).json({ message: "", user: userInfo });
  }

  return res.status(404).json({ error: "No user found" });
});

router.put("/follow/:id", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);

  if (!isAuth)
    return res.status(401).json({ error: "Please Login to continue" });

  const { id } = req.query;

  const userInfo = user as User;

  if (userInfo?._id) {
    const filter = { followers: userInfo._id };
    const isUserFollowing = await _userFilter(filter);

    // For following the user
    if (isUserFollowing.length === 0) {
      const updateFollowers = { $push: { followers: userInfo._id } };
      const updateFollowing = { $push: { following: id } };

      await _updateUserProfile(id as string, updateFollowers);
      await _updateUserProfile(userInfo._id as string, updateFollowing);
    }
    // For unfollowing the user
    else {
      const updateFollowers = { $pull: { followers: userInfo._id } };
      const updateFollowing = { $pull: { following: id } };

      await _updateUserProfile(id as string, updateFollowers);
      await _updateUserProfile(userInfo._id as string, updateFollowing);
    }

    const userProfile = await _getUserById(id as string);

    return res.status(200).json(userProfile);
  }

  return res.status(404).json({ error: "No user found" });
});

export { router as userRouter };
