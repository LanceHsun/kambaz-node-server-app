import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  _id: String,
  title: String,
  course: { type: String, ref: "CourseModel" },
  description: String,
  points: Number,
  due_dt: Date,
  available_dt: Date,
  until_dt: Date
},
{ collection: "assignments" }
);

export default assignmentSchema;