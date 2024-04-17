import mongoose, { Model } from "mongoose";

import "dotenv/config";

enum MessageType {
  General = 0,
  PostShare = 1,
  UserShare = 2,
  Restaurant = 3,
}

let StandardPostProjectOutput: Object = {
  _id: 0,
  id: "$_id",
  title: "$title",
  content: "$content",
  media: {
    $map: {
      input: "$media",

      as: "media",
      in: {
        resource_id: "$$media.resource_id",
        url: { $concat: [process.env.serverip, "/media/", "$$media.resource_id"] },
        title: "$$media.title",
      },
    },
  },
  distance: "$distance",
  user_id: "$user_id",
  restaurant_id: "$restaurant_id",
  created_at: "$created_at",
  reactions: "$reactions",
  grade: "$grade",
};

let RandomPostProjectOutput = {
  id: "$randomPost._id",
  title: "$randomPost.title",
  content: "$randomPost.content",
  media: {
    $map: {
      input: "$randomPost.media",
      as: "media",
      in: {
        resource_id: "$$media.resource_id",
        url: { $concat: [process.env.serverip, "/media/", "$$media.resource_id"] },
        title: "$$media.title",
      },
    },
  },
  distance: "$randomPost.distance",
  user_id: "$randomPost.user_id",
  restaurant_id: "$randomPost.restaurant_id",
  // restaurant_imageurl: { $concat: [process.env.serverip, "/restaurantimage/", "$randomPost.restaurant_id", ".jpg"] },
  location: "$distance",
  created_at: "$randomPost.created_at",
  reactions: "$randomPost.reactions",
  grade: "$randomPost.grade",
};

let ReactionProjectOutput = {
  _id: 0,
  post_id: 0,
  user_id: 1,
  liked: 1,
  reaction: 1,
  updated_at: 1,
  isFriend: 1,
};

const mediaSchema = new mongoose.Schema({
  resource_id: {
    type: String,
    required: true,
    unique: true,
    // index: true,
  },
  title: {
    type: String,
    default: null,
  },
});
const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    default: null,
  },
  content: {
    type: String,
    default: null,
  },
  media: {
    type: [mediaSchema],
    require: true,
  },
  user_id: {
    type: String,
    require: true,
    //index: true,
  },
  restaurant_id: {
    type: String,
    require: true,
    // index: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    //index: true,
  },
  created_at: {
    type: Date,
    require: true,
    default: new Date(),
  },
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    vomit: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
  },
  grade: {
    type: Number,
    default: null,
  },
});
const messageSchema = new mongoose.Schema({
  type: {
    type: Number,
    enum: [MessageType.General, MessageType.PostShare, MessageType.UserShare, MessageType.Restaurant],
    default: MessageType.General,
    require: true,
  },
  room_id: {
    type: String,
    require: true,
  },
  sender_id: {
    type: String,
    require: true,
  },
  message: {
    type: String,
    require: true,
  },
  isread: {
    type: Boolean,
    default: false,
  },

  shared_post_id: {
    type: String,
    require: false,
  },

  shared_user_id: {
    type: String,
    require: false,
  },
  shared_restaurant_id: {
    type: String,
    require: false,
  },

  created_time: {
    type: Date,
    require: true,
    default: new Date(),
  },
});
const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    require: true,
    unique: true,
    // index: true,
  },
  chatroom_ids: [
    {
      type: String,
    },
  ],
});
const chatroomSchema = new mongoose.Schema({
  user_ids: [
    {
      type: String,
    },
  ],
});
const reactionsSchema = new mongoose.Schema({
  post_id: {
    type: String,
    require: true,
    //index: true,
  },
  user_id: {
    type: String,
    require: true,
  },
  reaction: {
    type: Number,
    default: null,
  },
  liked: {
    type: Boolean,
    require: true,
    default: false,
  },
  updated_at: {
    type: Date,
    require: true,
    default: new Date(),
  },
});
const business_day_hoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: false,
    default: null,
  },
  close: {
    type: String,
    required: false,
    default: null,
  },
});
const business_timeSchema = new mongoose.Schema({
  place_id: {
    type: String,
    require: true,
    unique: true,
    //  index: true,
  },
  opening_hours: {
    type: {
      mon: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      tues: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      wed: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      thur: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      fri: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      sat: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      sun: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
    },
    require: false,
    default: null,
  },
});
[PostSchema, messageSchema, userSchema, chatroomSchema, reactionsSchema, business_day_hoursSchema, business_timeSchema].forEach((schema) => {
  schema.set("toJSON", {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      delete ret.$__;
      delete ret.$isNew;
    },
  });
});

var PostModel: Model<any> = mongoose.model("posts", PostSchema);
var MessageModel: Model<any> = mongoose.model("messages", messageSchema);
var UserModel: Model<any> = mongoose.model("users", userSchema);
var ChatRoomModel: Model<any> = mongoose.model("chatRooms", chatroomSchema);
var ReactionModel: Model<any> = mongoose.model("reactions", reactionsSchema);
var Business_Day_HoursModel: Model<any> = mongoose.model("business_day_hours", business_day_hoursSchema);
var Business_TimesModel: Model<any> = mongoose.model("business_times", business_timeSchema);

export {
  PostModel,
  MessageModel,
  UserModel,
  ChatRoomModel,
  ReactionModel,
  Business_Day_HoursModel,
  Business_TimesModel,
  StandardPostProjectOutput,
  RandomPostProjectOutput,
  ReactionProjectOutput,
  MessageType,
};

/*import mongoose, { Model, Mongoose } from "mongoose";

import "dotenv/config";

enum MessageType {
  General = 0,
  PostShare = 1,
  UserShare = 2,
  Restaurant = 3,
}

let StandardPostProjectOutput: Object = {
  _id: 0,
  post_id: "$_id",
  post_title: "$post_title",
  post_content: "$post_content",
  media_data: {
    $map: {
      input: "$media_data",

      as: "media",
      in: {
        url: { $concat: [process.env.serverip, "/media/", "$$media.media_id"] },
        itemtitle: "$$media.itemtitle",
      },
    },
  },
  distance: "$distance",
  user_id: "$user_id",
  restaurant_id: "$restaurant_id",
  created_at: "$created_at",
  reactions: "$reactions",
  grade: "$grade",
};

let RandomPostProjectOutput = {
  post_id: "$randomPost._id",
  post_title: "$randomPost.post_title",
  post_content: "$randomPost.post_content",
  media_data: {
    $map: {
      input: "$randomPost.media_data",
      as: "media",
      in: {
        url: { $concat: [process.env.serverip, "/media/", "$$media.media_id"] },
        itemtitle: "$$media.itemtitle",
      },
    },
  },
  distance: "$randomPost.distance",
  user_id: "$randomPost.user_id",
  restaurant_id: "$randomPost.restaurant_id",
  restaurant_imageurl: { $concat: [process.env.serverip, "/restaurantimage/", "$randomPost.restaurant_id", ".jpg"] },
  location: "$distance",
  created_at: "$randomPost.created_at",
  reactions: "$randomPost.reactions",
  grade: "$randomPost.grade",
};

let ReactionProjectOutput = {
  _id: 0,
  post_id: 0,
  user_id: 1,
  liked: 1,
  reaction: 1,
  updated_at: 1,
  isFriend: 1,
};

const mediaSchema = new mongoose.Schema({
  media_id: {
    type: String,
    required: true,
  },
  itemtitle: {
    type: String,
    default: null,
  },
});
const PostSchema = new mongoose.Schema({
  post_title: {
    type: String,
    default: null,
  },
  post_content: {
    type: String,
    default: null,
  },
  media_data: {
    type: [mediaSchema],
    require: true,
  },
  user_id: {
    type: Number,
    require: true,
  },
  restaurant_id: {
    type: String,
    require: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  created_at: {
    type: Date,
    require: true,
    default: new Date(),
  },
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    vomit: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
  },
  grade: {
    type: Number,
    default: null,
  },
});
const messageSchema = new mongoose.Schema({
  type: {
    type: Number,
    enum: [MessageType.General, MessageType.PostShare, MessageType.UserShare, MessageType.Restaurant],
    default: MessageType.General,
  },
  room_id: {
    type: String,
    require: true,
  },
  sender_id: {
    type: Number,
    require: true,
  },
  message: {
    type: String,
    require: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },

  shared_Post_id: {
    type: String,
    require: false,
  },

  shared_User_id: {
    type: Number,
    require: false,
  },
  shared_Restaurant_id: {
    type: String,
    require: false,
  },

  created_time: {
    type: Date,
    require: true,
    default: new Date(),
  },
});
const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    require: true,
  },
  chatRoomIds: [
    {
      type: String,
    },
  ],
});
const chatroomSchema = new mongoose.Schema({
  room_id: {
    type: String,
    require: true,
  },
  room_users: [
    {
      type: Number,
    },
  ],
});
const reactionsSchema = new mongoose.Schema({
  post_id: {
    type: String,
    require: true,
  },
  user_id: {
    type: Number,
    require: true,
  },
  reaction: {
    type: Number,
    default: null,
  },
  liked: {
    type: Boolean,
    require: true,
    default: false,
  },
  updated_at: {
    type: Date,
    require: true,
    default: new Date(),
  },
});
const business_day_hoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: false,
    default: null,
  },
  close: {
    type: String,
    required: false,
    default: null,
  },
});
const business_timeSchema = new mongoose.Schema({
  place_id: {
    type: String,
    require: true,
  },
  opening_hours: {
    type: {
      mon: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      tues: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      wed: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      thur: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      fri: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      sat: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      sun: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
    },
    require: false,
    default: null,
  },
});
[PostSchema, messageSchema, userSchema, chatroomSchema, reactionsSchema, business_day_hoursSchema, business_timeSchema].forEach((schema) => {
  schema.set("toJSON", {
    transform: (doc, ret) => {
      // 删除不需要输出的属性
      delete ret._id;
      delete ret.__v;
      delete ret.$__;
      delete ret.$isNew;
      // 可以继续删除其他属性
    },
  });
});

var PostModel: Model<any> = mongoose.model("posts", PostSchema);
var MessageModel: Model<any> = mongoose.model("messages", messageSchema);
var UserModel: Model<any> = mongoose.model("users", userSchema);
var ChatRoomModel: Model<any> = mongoose.model("chatRooms", chatroomSchema);
var ReactionModel: Model<any> = mongoose.model("reactions", reactionsSchema);
var Business_Day_HoursModel: Model<any> = mongoose.model("business_day_hours", business_day_hoursSchema);
var Business_TimesModel: Model<any> = mongoose.model("business_times", business_timeSchema);

export {
  PostModel,
  MessageModel,
  UserModel,
  ChatRoomModel,
  ReactionModel,
  Business_Day_HoursModel,
  Business_TimesModel,
  StandardPostProjectOutput,
  RandomPostProjectOutput,
  ReactionProjectOutput,
  MessageType,
};
*/
