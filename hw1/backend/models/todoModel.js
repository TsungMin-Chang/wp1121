import mongoose from "mongoose";

// Create a schema
const diarySchema = new mongoose.Schema(
  {
    feeling: {
      type: Number,
      required: true,
    },
    category: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    }
  },
  // The second argument is an options object.
  // In this case, we want to rename _id to id and remove __v
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
    // This option is to make sure that when a new document is created,
    // the timestamps will be added automatically.
    // You can comment this out to see the difference.
    timestamps: true,
  },
);

// Create a model
const DiaryModel = mongoose.model("Diary", diarySchema);

export default DiaryModel;
