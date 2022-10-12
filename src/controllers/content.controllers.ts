import CommentModel from "../models/comment.model";
import ContentModel from "../models/content.model";

export const _createContent = async (body: any) => {
  return ContentModel.create(body);
};

export const _createComment = async (title: string) => {
  return CommentModel.create({ title });
};

export const _contentFilter = async (filter: any) => {
  return await ContentModel.find(filter);
};

export const _getContents = async () => {
  return await ContentModel.find({})
    .populate("owner")
    .sort({ createdAt: -1 })
    .exec();
};

export const _getContentById = async (_id: string) => {
  let content = await ContentModel.findOne({ _id }).populate("owner").exec();

  content = await content.populate("owner.followers");
  content = await content.populate("likes");

  return content;
};

export const _getContentsByUserId = async (owner: string) => {
  // it should be find and not findOne
  return await ContentModel.find({ owner })
    .populate("owner")
    .sort({ createdAt: -1 });
};

export const _updateContent = async (_id: string, update: any) => {
  const filter = { _id };
  const content = await ContentModel.updateOne(filter, update)
    .populate("owner")
    .populate("likes");

  return content;
};

export const _getCommentById = async (_id: string) => {
  return await CommentModel.findOne({ _id })
    .sort({
      "comments.createdAt": -1,
    })
    .populate("comments.owner");
};

export const _updateComments = async (filter: any, update: any) => {
  return await CommentModel.updateOne(filter, update);
};

export const _commentFilter = async (filter: any) => {
  return await CommentModel.find(filter);
};
