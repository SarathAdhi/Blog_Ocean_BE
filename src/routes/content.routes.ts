import express, { Request, Response } from "express";
import {
  _commentFilter,
  _contentFilter,
  _createComment,
  _createContent,
  _deleteContentById,
  _getCommentById,
  _getContentById,
  _getContents,
  _getContentsByUserId,
  _updateComments,
  _updateContent,
} from "../controllers/content.controllers";
import { validateToken } from "../middleware/verifyToken";
import { Comment, Content } from "../_types/content";
import { User } from "../_types/user";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const { id } = req.query;

  if (id) {
    try {
      const content = await _getContentById(id as string);

      return res.status(200).json(content);
    } catch (error: any) {
      const msg = error?.message as string;

      if (msg.includes("Cast to ObjectId failed for value"))
        return res
          .status(404)
          .json({ error: "Content doesn't exist. Invalid url" });

      return res.status(404).json({ error });
    }
  }

  const contents = await _getContents();
  return res.status(200).json(contents);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { title } = req.body;

  try {
    await _updateContent(id as string, req.body);

    return res.status(200).json({
      message: "Content updated successfully",
      error: "",
      data: { title },
    });
  } catch (error: any) {
    return res.status(404).json({ error });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await _deleteContentById(id as string);

    return res
      .status(200)
      .json({ message: "Content deleted successfully", error: "" });
  } catch (error: any) {
    const msg = error?.message as string;

    if (msg.includes("Cast to ObjectId failed for value"))
      return res
        .status(404)
        .json({ error: "Content doesn't exist. Invalid url" });

    return res.status(404).json({ error });
  }
});

router.post("/create", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);

  if (!isAuth)
    return res.status(401).json({ error: "Please Login to continue" });

  const userDetails = user as User;

  try {
    const { title } = req.body;
    const comment: Comment = await _createComment(title);

    const content = {
      ...req.body,
      owner: userDetails._id,
      comment: comment._id,
    };

    const data = await _createContent(content);

    return res
      .status(200)
      .json({ data, message: "Content published successfully." });
  } catch ({ message }) {
    return res.status(200).json({ error: message });
  }
});

router.get("/:user", async (req: Request, res: Response) => {
  // const { isAuth } = await validateToken(req.headers.authorization!);

  // if (!isAuth) return res.status(401).json({ error: "Please Login to continue" });

  const { user } = req.params;

  const contents = await _getContentsByUserId(user as string);
  return res.status(200).json(contents);
});

router.get("/like/:id", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);

  if (!isAuth)
    return res.status(401).json({ error: "Please Login to continue" });

  const { id } = req.params;

  const userInfo = user as User;

  if (userInfo?._id) {
    const filter = { _id: id, likes: userInfo._id };
    const isUserLikedTheContent = await _contentFilter(filter);

    // For liking the content
    if (isUserLikedTheContent.length === 0) {
      const updateLikes = { $push: { likes: userInfo._id } };

      await _updateContent(id as string, updateLikes);
    }
    // For undo like in the content
    else {
      const updateLikes = { $pull: { likes: userInfo._id } };
      console.log(updateLikes);

      await _updateContent(id as string, updateLikes);
    }

    const content = await _getContentById(id as string);
    return res.status(200).json(content);
  }

  return res.status(404).json({ error: "No user found" });
});

router.get("/comment/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const comments: Comment = await _getCommentById(id as string);

  return res.status(200).json(comments);

  // const { isAuth, user } = await validateToken(req.headers.authorization!);
  // if (!isAuth)
  //   return res.status(401).json({ error: "Please Login to continue" });

  // const userInfo = user as User;

  // if (userInfo?._id) {
  //   const comments: Comment = await _getCommentById(id as string);

  //   return res.status(200).json(comments);
  // }

  // return res.status(404).json({ error: "No user found" });
});

router.post("/comment/:id", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);

  if (!isAuth)
    return res.status(401).json({ error: "Please Login to continue" });

  const { id } = req.params;
  const { comment } = req.body;

  const userInfo = user as User;

  if (userInfo?._id) {
    const commentObject = {
      owner: userInfo._id,
      comment,
    };

    const addComment = { $push: { comments: commentObject } };
    await _updateComments({ _id: id }, addComment);

    const comments: Comment = await _getCommentById(id as string);
    return res.status(200).json(comments);
  }

  return res.status(404).json({ error: "No user found" });
});

router.post("/comment/reactions/:id", async (req: Request, res: Response) => {
  const { isAuth, user } = await validateToken(req.headers.authorization!);

  if (!isAuth)
    return res.status(401).json({ error: "Please Login to continue" });

  const { id } = req.params;
  const { emoji, commentCollectionId } = req.body;

  const userInfo = user as User;

  if (userInfo?._id) {
    const filter = {
      _id: id,
      "comments._id": commentCollectionId,
    };

    const _contentDetails = await _commentFilter(filter);

    const contentDetails = _contentDetails[0] as Content["comment"];

    const comments = contentDetails?.comments;

    const getComment = comments?.find(
      (comment) => String(comment._id) === String(commentCollectionId)
    );

    const isUserReacted = getComment?.reactions.find(
      (reaction) => String(reaction.user) === String(userInfo._id)
    );

    const reactedEmoji = isUserReacted?.emoji;

    const reaction = {
      user: userInfo._id,
      emoji,
    };

    // For reacting to the content comment
    if (!isUserReacted) {
      const updateLikes = {
        $push: { "comments.$.reactions": reaction },
      };

      await _updateComments(filter, updateLikes);
    }
    // For new emoji reaction
    else if (reactedEmoji !== emoji && isUserReacted) {
      const updateLikes = {
        $set: { "comments.$.reactions": reaction },
      };

      await _updateComments(filter, updateLikes);
    }
    // For undo comment reaction
    else {
      const updateLikes = {
        $pull: { "comments.$.reactions": reaction },
      };

      await _updateComments(filter, updateLikes);
    }

    return res.status(200).json({ error: "" });
  }

  return res.status(404).json({ error: "No user found" });
});

export { router as contentRouter };
