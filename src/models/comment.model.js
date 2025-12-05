import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// aggregatePaginate is a tool in Mongoose that helps you apply pagination to aggregation results so you can get data page-by-page instead of all at once.

const commentSchema = new Schema(
  {
    content: {
        type: String,
        required: true,
        },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }},
    { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);

export { Comment };








