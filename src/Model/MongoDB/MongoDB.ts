import mongoose from "mongoose";
async function connectToMongoDB() {
  try {
    let mongodb = await mongoose.connect("mongodb://127.0.0.1:27017/locationpicker");
    return mongodb;
  } catch (error) {
    throw error;
  }
}
async function disconnect() {
  await mongoose.disconnect();
}

mongoose.connection.once("open", () => {
  console.log("mongodb連接成功");
});
mongoose.connection.on("error", () => {
  console.log("mongodb連接失敗");
});
mongoose.connection.on("close", () => {
  console.log("mongodb連接關閉");
});
export = { connectToMongoDB, disconnect };
